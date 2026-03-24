import { v } from "convex/values";
import { api, internal } from "./_generated/api.js";
import type { Doc, Id } from "./_generated/dataModel.js";
import {
  internalMutation,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server.js";
import { getAuthContext } from "./lib/auth";
import {
  adjustUsage,
  getUsageOwnerId,
  resolveUsageOwnerFromDoc,
} from "./lib/usage";
import {
  socialProviderCreateSchema,
  socialProviderSchema,
  socialProviderUpdateSchema,
} from "./schemas/index";
import { getCurrentUser } from "./users";
import { decryptData, encryptData, getCurrentTimestamp } from "./utils";

// Core helper — no auth dependency
export async function getConnectedAccountsCore(
  ctx: QueryCtx,
  userId: Id<"users">
) {
  const providers = await ctx.db
    .query("socialProviders")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();
  providers.sort((a, b) => b._creationTime - a._creationTime);
  return providers;
}

export const getConnectedAccounts = query({
  args: {},
  returns: v.array(socialProviderSchema),
  handler: async (ctx) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return [];
    }

    // In org context, show org's social providers; in personal, show user's
    if (authCtx.organizationId) {
      const providers = await ctx.db
        .query("socialProviders")
        .withIndex("by_organization_id", (q) =>
          q.eq("organizationId", authCtx.organizationId)
        )
        .collect();
      providers.sort((a, b) => b._creationTime - a._creationTime);
      return providers;
    }

    return getConnectedAccountsCore(ctx, authCtx.userId);
  },
});

// Function to delete social provider by ID (used by components)
export const deleteSocial = mutation({
  args: {
    socialId: v.id("socialProviders"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get user first
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify ownership
    const socialProvider = await ctx.db.get(args.socialId);
    if (!socialProvider || socialProvider.userId !== user._id) {
      throw new Error("Social provider not found or access denied");
    }

    // Use the existing deleteSocialProvider function
    await ctx.runMutation(api.social_providers.deleteSocialProvider, {
      id: args.socialId,
    });

    return { success: true };
  },
});

export const connectFacebookPage = mutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(), // Real access token from tRPC
    pageId: v.string(),
    pageName: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal("connected"), v.literal("transferred")),
  }),
  handler: async (ctx, args) => {
    // Encrypt the access token
    const encryptedAccessToken = await encryptData(args.accessToken);

    // Check if this Facebook page is already connected
    const existingProvider = await ctx.db
      .query("socialProviders")
      .withIndex("by_profile_id", (q) => q.eq("profileId", args.pageId))
      .first();

    const now = getCurrentTimestamp();
    const twoMonthsFromNow = now + 2 * 30 * 24 * 60 * 60 * 1000;

    if (existingProvider && existingProvider.userId !== args.userId) {
      // Transfer ownership
      await ctx.db.patch(existingProvider._id, {
        userId: args.userId,
        accessToken: encryptedAccessToken,
        fullName: args.pageName,
        username: args.pageName,
        profileImage: `https://graph.facebook.com/${args.pageId}/picture?type=large`,
        refreshTokenExpiresIn: twoMonthsFromNow,
        updatedAt: now,
        isActive: true,
        lastSyncedAt: now,
      });

      return { status: "transferred" as const };
    }

    if (existingProvider && existingProvider.userId === args.userId) {
      // Update existing
      await ctx.db.patch(existingProvider._id, {
        accessToken: encryptedAccessToken,
        fullName: args.pageName,
        username: args.pageName,
        profileImage: `https://graph.facebook.com/${args.pageId}/picture?type=large`,
        refreshTokenExpiresIn: twoMonthsFromNow,
        updatedAt: now,
        isActive: true,
        lastSyncedAt: now,
      });

      return { status: "connected" as const };
    }

    // Create new connection
    await ctx.db.insert("socialProviders", {
      userId: args.userId,
      socialType: "FACEBOOK",
      accessToken: encryptedAccessToken,
      profileId: args.pageId,
      username: args.pageName,
      fullName: args.pageName,
      profileImage: `https://graph.facebook.com/${args.pageId}/picture?type=large`,
      isActive: true,
      lastSyncedAt: now,
      expiresIn: twoMonthsFromNow,
      refreshTokenExpiresIn: twoMonthsFromNow,
      updatedAt: now,
    });

    // Increment social accounts counter on the user
    await adjustUsage(ctx, args.userId, "socialAccounts", 1);

    return { status: "connected" as const };
  },
});

// Internal function to get social provider with decrypted tokens
export const getSocialProviderWithDecryptedTokens = query({
  args: { id: v.id("socialProviders") },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("socialProviders")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    if (!provider) {
      return null;
    }

    try {
      // Decrypt tokens
      const decryptedAccessToken = await decryptData(provider.accessToken);
      const decryptedRefreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : undefined;

      return {
        ...provider,
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
      };
    } catch (_error) {
      // Failed to decrypt tokens for provider
      return null;
    }
  },
});

// Internal function to clean up posts when social provider is deleted
export const cleanupPostsForDeletedSocialProvider = internalMutation({
  args: { socialProviderId: v.id("socialProviders"), userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Find all posts that reference this social provider
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    let updatedPostsCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData: Partial<Doc<"posts">> = {};

      // Remove from socialProviderIds array
      if (post.socialProviderIds.includes(args.socialProviderId)) {
        updateData.socialProviderIds = post.socialProviderIds.filter(
          (id) => id !== args.socialProviderId
        );
        needsUpdate = true;
      }

      // Remove from alternativeContent array
      if (post.alternativeContent) {
        const filteredAlternativeContent = post.alternativeContent.filter(
          (alt) => alt.socialProviderId !== args.socialProviderId
        );

        if (
          filteredAlternativeContent.length !== post.alternativeContent.length
        ) {
          updateData.alternativeContent =
            filteredAlternativeContent.length > 0
              ? filteredAlternativeContent
              : undefined;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        updateData.updatedAt = getCurrentTimestamp();
        await ctx.db.patch(post._id, updateData);
        updatedPostsCount++;
      }
    }

    return updatedPostsCount;
  },
});

// Main delete function that handles cascade cleanup
export const deleteSocialProvider = mutation({
  args: { id: v.id("socialProviders") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      throw new Error("User not found");
    }

    const provider = await ctx.db
      .query("socialProviders")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    if (!provider) {
      throw new Error("Social provider not found");
    }

    if (provider.userId !== authCtx.userId) {
      throw new Error(
        "You are not allowed to delete this social provider, it belongs to another user"
      );
    }

    // Decrement social accounts counter on usage owner
    const ownerId = await getUsageOwnerId(ctx, authCtx);
    await adjustUsage(ctx, ownerId, "socialAccounts", -1);

    // Clean up posts that reference this social provider
    await ctx.runMutation(
      internal.social_providers.cleanupPostsForDeletedSocialProvider,
      {
        socialProviderId: args.id,
        userId: provider.userId,
      }
    );

    // Delete the social provider
    await ctx.db.delete(provider._id);

    return true;
  },
});

// Upsert social provider with encrypted tokens
export const upsertSocialProvider = mutation({
  args: socialProviderCreateSchema.fields,
  returns: v.union(
    v.literal("created"),
    v.literal("account_transferred"),
    v.literal("updated")
  ),
  handler: async (ctx, args) => {
    try {
      const authCtx = await getAuthContext(ctx);
      if (!authCtx) {
        throw new Error("User not found");
      }
      const userId = authCtx.userId;
      const now = getCurrentTimestamp();
      // Encrypt tokens once
      const encryptedAccessToken = await encryptData(args.accessToken);
      const encryptedRefreshToken = args.refreshToken
        ? await encryptData(args.refreshToken)
        : undefined;

      // Check if provider exists
      const existingProvider = await ctx.db
        .query("socialProviders")
        .withIndex("by_profile_id", (q) => q.eq("profileId", args.profileId))
        .unique();

      if (existingProvider) {
        // Update existing provider
        await ctx.db.patch(existingProvider._id, {
          ...args,
          userId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          updatedAt: now,
        });
        if (existingProvider.userId !== userId) {
          return "account_transferred";
        }
        return "updated";
      }

      // Create new provider — auto-set org from auth context
      await ctx.db.insert("socialProviders", {
        ...args,
        userId,
        organizationId: authCtx.organizationId ?? args.organizationId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        updatedAt: now,
        isActive: args.isActive ?? true,
      });

      // Increment social accounts counter on usage owner
      const ownerId = await getUsageOwnerId(ctx, authCtx);
      await adjustUsage(ctx, ownerId, "socialAccounts", 1);

      return "created";
    } catch (_error) {
      throw new Error("Token encryption failed");
    }
  },
});

export const updateSocialProvider = mutation({
  args: v.object({
    id: v.id("socialProviders"),
    ...socialProviderUpdateSchema.fields,
  }),
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error("Social provider not found");
    }
    const { id, ...restData } = args;

    // Build update data with encrypted tokens if provided
    const updateData = { ...restData };

    // Encrypt tokens if they're being updated
    if (updateData.accessToken) {
      updateData.accessToken = await encryptData(updateData.accessToken);
    }
    if (updateData.refreshToken) {
      updateData.refreshToken = await encryptData(updateData.refreshToken);
    }

    await ctx.db.patch(provider._id, {
      ...updateData,
      updatedAt: getCurrentTimestamp(),
    });
    return true;
  },
});

/**
 * Get social provider by profile ID and type (used by Lambda processor)
 */
export const getByProfileId = query({
  args: {
    profileId: v.string(),
    socialType: v.string(),
  },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("socialProviders")
      .withIndex("by_profile_id", (q) => q.eq("profileId", args.profileId))
      .first();

    if (!provider || provider.socialType !== args.socialType) {
      return null;
    }

    // Return with decrypted tokens for API calls
    try {
      const decryptedAccessToken = await decryptData(provider.accessToken);
      const decryptedRefreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : undefined;

      return {
        ...provider,
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
      };
    } catch {
      return null;
    }
  },
});

// OAuth callback mutation - accepts userId parameter, no auth token needed
// Security: userId comes from cryptographically signed OAuth state parameter
// This is used when Clerk session is lost during OAuth redirect (local dev)
export const upsertSocialProviderFromOAuth = mutation({
  args: v.object({
    ...socialProviderCreateSchema.fields,
  }),
  returns: v.union(
    v.literal("created"),
    v.literal("account_transferred"),
    v.literal("updated")
  ),
  handler: async (ctx, args) => {
    const { userId, ...providerData } = args;
    const now = getCurrentTimestamp();

    // Encrypt tokens
    const encryptedAccessToken = await encryptData(providerData.accessToken);
    const encryptedRefreshToken = providerData.refreshToken
      ? await encryptData(providerData.refreshToken)
      : undefined;

    // Check if provider exists by profileId
    const existingProvider = await ctx.db
      .query("socialProviders")
      .withIndex("by_profile_id", (q) =>
        q.eq("profileId", providerData.profileId)
      )
      .unique();

    if (existingProvider) {
      // Update existing provider
      await ctx.db.patch(existingProvider._id, {
        ...providerData,
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        updatedAt: now,
      });

      if (existingProvider.userId !== userId) {
        return "account_transferred";
      }
      return "updated";
    }

    // Create new provider
    await ctx.db.insert("socialProviders", {
      ...providerData,
      userId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      updatedAt: now,
      isActive: providerData.isActive ?? true,
    });

    // Increment social accounts counter on the user
    await adjustUsage(ctx, userId ?? null, "socialAccounts", 1);

    return "created";
  },
});

// Transfer a social provider to/from an organization
export const transferSocialProvider = mutation({
  args: {
    id: v.id("socialProviders"),
    targetOrganizationId: v.optional(v.string()), // undefined = move to personal
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      throw new Error("Unauthorized");
    }

    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error("Social provider not found");
    }

    // Must own the provider
    if (provider.userId !== authCtx.userId) {
      throw new Error("You don't own this social provider");
    }

    const sourceOrgId = provider.organizationId;
    const targetOrgId = args.targetOrganizationId;

    // No-op if already in the target
    if (sourceOrgId === targetOrgId) {
      return true;
    }

    // Resolve source usage owner
    const sourceOwnerId = await resolveUsageOwnerFromDoc(ctx, provider);

    // Resolve target usage owner
    let targetOwnerId = authCtx.userId;
    if (targetOrgId) {
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", targetOrgId))
        .unique();
      if (!org) {
        throw new Error("Organization not found");
      }
      const creator = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) => q.eq("externalId", org.createdBy))
        .unique();
      targetOwnerId = creator?._id ?? authCtx.userId;
    }

    // Update the provider
    await ctx.db.patch(args.id, {
      organizationId: targetOrgId,
      updatedAt: getCurrentTimestamp(),
    });

    // Adjust usage counters
    await adjustUsage(ctx, sourceOwnerId, "socialAccounts", -1);
    await adjustUsage(ctx, targetOwnerId, "socialAccounts", 1);

    return true;
  },
});

// ============================================================================
// PUBLIC API VARIANTS (for REST API / MCP server)
// ============================================================================

export const apiGetConnectedAccounts = query({
  args: { userId: v.id("users") },
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    return getConnectedAccountsCore(ctx, args.userId);
  },
});

export const apiGetAccountById = query({
  args: { userId: v.id("users"), accountId: v.id("socialProviders") },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.accountId);
    if (!provider || provider.userId !== args.userId) {
      return null;
    }
    return provider;
  },
});
