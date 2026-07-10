import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { apiKeySchema, apiKeyScopeSchema } from "./schemas";
import { getCurrentUser } from "./users";
import { getCurrentTimestamp } from "./utils";

// ============================================================================
// PUBLIC API (used by REST API server for API key validation)
// ============================================================================

/**
 * Validate an API key by its hash.
 * Returns user info and scopes if valid, null if invalid/revoked/expired.
 */
export const validateApiKey = query({
  args: { keyHash: v.string() },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      scopes: v.array(apiKeyScopeSchema),
      planType: v.union(
        v.literal("FREE"),
        v.literal("ECHO"),
        v.literal("VIBE")
      ),
      apiKeyId: v.id("apiKeys"),
      organizationId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .unique();

    if (!apiKey) {
      return null;
    }
    if (apiKey.revokedAt) {
      return null;
    }
    if (apiKey.expiresAt && apiKey.expiresAt < getCurrentTimestamp()) {
      return null;
    }

    const user = await ctx.db.get(apiKey.userId);
    if (!user) {
      return null;
    }

    let planType: "FREE" | "ECHO" | "VIBE" = "FREE";
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription && subscription.status === "ACTIVE") {
        planType = subscription.planType;
      }
    }

    return {
      userId: apiKey.userId,
      scopes: apiKey.scopes,
      planType,
      apiKeyId: apiKey._id,
      organizationId: apiKey.organizationId,
    };
  },
});

/**
 * Update the lastUsedAt timestamp for an API key.
 */
export const updateLastUsed = mutation({
  args: { keyId: v.id("apiKeys") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      lastUsedAt: getCurrentTimestamp(),
    });
  },
});

/**
 * Resolve a Clerk OAuth subject to the same auth context shape used by the REST
 * API. Token verification happens in the edge API before this query is called.
 */
export const resolveOAuthSubject = query({
  args: {
    externalId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      planType: v.union(
        v.literal("FREE"),
        v.literal("ECHO"),
        v.literal("VIBE")
      ),
      organizationId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (!user) {
      return null;
    }

    let planType: "FREE" | "ECHO" | "VIBE" = "FREE";
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription && subscription.status === "ACTIVE") {
        planType = subscription.planType;
      }
    }

    if (!args.organizationId) {
      return { userId: user._id, planType };
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) =>
        q.eq("clerkOrgId", args.organizationId!)
      )
      .unique();

    if (!org) {
      return null;
    }

    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", org._id).eq("userId", user._id)
      )
      .unique();

    if (!member) {
      return null;
    }

    return {
      userId: user._id,
      planType,
      organizationId: args.organizationId,
    };
  },
});

// ============================================================================
// DASHBOARD (Clerk-authenticated, used by the web app)
// ============================================================================

/**
 * Create a new API key. Called from the dashboard.
 * Generates the key client-side, hashes it, and stores only the hash.
 * Returns the key ID (the raw key is shown once to the user client-side).
 */
export const createApiKey = mutation({
  args: {
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    scopes: v.array(apiKeyScopeSchema),
    expiresAt: v.optional(v.number()),
    organizationId: v.optional(v.string()),
  },
  returns: v.id("apiKeys"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // If org-scoped, verify the user is a member of the org
    if (args.organizationId) {
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_org_id", (q) =>
          q.eq("clerkOrgId", args.organizationId!)
        )
        .unique();
      if (!org) {
        throw new Error("Organization not found");
      }

      const member = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org_user", (q) =>
          q.eq("organizationId", org._id).eq("userId", user._id)
        )
        .unique();
      if (!member) {
        throw new Error("You are not a member of this organization");
      }
    }

    const now = getCurrentTimestamp();
    return await ctx.db.insert("apiKeys", {
      userId: user._id,
      name: args.name,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix,
      scopes: args.scopes,
      organizationId: args.organizationId,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * List API keys for the current user (metadata only, no hashes).
 */
export const listApiKeys = query({
  args: {},
  returns: v.array(apiKeySchema),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    return keys
      .filter((k) => !k.revokedAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Revoke an API key. Only the owner can revoke their own keys.
 */
export const revokeApiKey = mutation({
  args: { keyId: v.id("apiKeys") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== user._id) {
      return false;
    }

    await ctx.db.patch(args.keyId, {
      revokedAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
    return true;
  },
});
