import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  automationCreateSchema,
  automationSchema,
  automationSessionSchema,
  automationStepSchema,
  automationUpdateSchema,
  DM_PLAN_LIMITS,
  triggerStepSchema,
} from "./schemas/automations";
import { getCurrentUser } from "./users";
import { decryptData, getCurrentTimestamp } from "./utils";

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all automations for the current user
 */
export const getAutomations = query({
  args: {
    socialProviderId: v.optional(v.id("socialProviders")),
  },
  returns: v.array(automationSchema),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: type inferred from query result
    let automations;
    if (args.socialProviderId) {
      automations = await ctx.db
        .query("automations")
        .withIndex("by_social_provider_id", (q) =>
          q.eq("socialProviderId", args.socialProviderId!)
        )
        .collect();
    } else {
      automations = await ctx.db
        .query("automations")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();
    }

    // Sort by creation date (newest first)
    automations.sort((a, b) => b._creationTime - a._creationTime);

    return automations;
  },
});

/**
 * Get a single automation by ID
 */
export const getAutomation = query({
  args: { id: v.id("automations") },
  returns: v.union(automationSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      return null;
    }

    return automation;
  },
});

/**
 * Get automations + access token + usage for webhook processing (called by Lambda)
 * Single query: automations + token + plan limits + usage
 */
export const getForWebhook = query({
  args: {
    webhookSecret: v.string(),
    instagramAccountId: v.string(),
    mediaId: v.string(),
  },
  returns: v.union(
    v.object({
      automations: v.array(
        v.object({
          _id: v.id("automations"),
          triggers: v.array(triggerStepSchema),
          steps: v.array(automationStepSchema),
        })
      ),
      accessToken: v.string(),
      profileId: v.string(),
      userId: v.id("users"),
      planType: v.union(
        v.literal("FREE"),
        v.literal("VIBE"),
        v.literal("ECHO")
      ),
      dmsSent: v.optional(v.number()),
      dmLimit: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Verify shared secret
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      console.log("[getForWebhook] Secret mismatch");
      return null;
    }

    // 1. Find social provider by profileId
    const provider = await ctx.db
      .query("socialProviders")
      .withIndex("by_profile_id", (q) =>
        q.eq("profileId", args.instagramAccountId)
      )
      .first();

    if (!provider || provider.socialType !== "INSTAGRAM") {
      console.log(
        `[getForWebhook] No Instagram provider for profileId=${args.instagramAccountId}`
      );
      return null;
    }

    // 2. Get active automations that have a trigger targeting this mediaId
    const allAutomations = await ctx.db
      .query("automations")
      .withIndex("by_social_provider_active", (q) =>
        q.eq("socialProviderId", provider._id).eq("isActive", true)
      )
      .collect();

    console.log(
      `[getForWebhook] Provider ${provider._id}, found ${allAutomations.length} active automations`
    );

    // Filter to automations where any trigger targets this mediaId
    const matchingAutomations = allAutomations.filter((a) =>
      a.triggers.some((t) => t.targetPostIds.includes(args.mediaId))
    );

    if (matchingAutomations.length === 0) {
      console.log(
        `[getForWebhook] No automations target mediaId=${args.mediaId}. Active automations target: ${
          allAutomations
            .flatMap((a) => a.triggers.flatMap((t) => t.targetPostIds))
            .join(", ") || "none"
        }`
      );
      return null;
    }

    // 3. Get user + subscription for plan limits
    const user = await ctx.db.get(provider.userId!);
    if (!user) {
      return null;
    }

    let planType: "FREE" | "VIBE" | "ECHO" = "FREE";
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription && subscription.status === "ACTIVE") {
        planType = subscription.planType as "FREE" | "VIBE" | "ECHO";
      }
    }

    // 4. Decrypt access token
    const accessToken = await decryptData(provider.accessToken);

    return {
      automations: matchingAutomations.map((a) => ({
        _id: a._id,
        triggers: a.triggers,
        steps: a.steps,
      })),
      accessToken,
      profileId: provider.profileId,
      planType,
      userId: user._id,
      dmsSent: user.usage.dmsSent ?? 0,
      dmLimit: DM_PLAN_LIMITS[planType],
    };
  },
});

/**
 * Record a DM sent (called by Lambda)
 * Single mutation: increment usage + stats + minimal log
 */
export const recordDMSent = mutation({
  args: {
    webhookSecret: v.string(),
    userId: v.id("users"),
    automationId: v.id("automations"),
    instagramCommentId: v.string(),
    instagramUsername: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify shared secret
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const now = getCurrentTimestamp();

    // 1. Increment user usage.dmsSent
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        usage: {
          ...user.usage,
          dmsSent: user.usage.dmsSent ? user.usage.dmsSent + 1 : 1,
        },
        updatedAt: now,
      });
    }

    // 2. Increment automation stats
    const automation = await ctx.db.get(args.automationId);
    if (automation) {
      await ctx.db.patch(args.automationId, {
        totalTriggered: automation.totalTriggered + 1,
        totalDMsSent: automation.totalDMsSent + 1,
        updatedAt: now,
      });
    }

    // 3. Insert minimal log
    await ctx.db.insert("automationLogs", {
      automationId: args.automationId,
      userId: args.userId,
      instagramCommentId: args.instagramCommentId,
      instagramUsername: args.instagramUsername,
      status: "DM_SENT",
      createdAt: now,
    });

    return null;
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new automation
 */
export const createAutomation = mutation({
  args: automationCreateSchema.fields,
  returns: v.id("automations"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user owns the social provider
    const socialProvider = await ctx.db.get(args.socialProviderId);
    if (!socialProvider || socialProvider.userId !== user._id) {
      throw new Error("Social provider not found or access denied");
    }

    // Only allow Instagram providers
    if (socialProvider.socialType !== "INSTAGRAM") {
      throw new Error("Automations are only supported for Instagram accounts");
    }

    const now = getCurrentTimestamp();

    const automationId = await ctx.db.insert("automations", {
      userId: user._id,
      organizationId: args.organizationId,
      socialProviderId: args.socialProviderId,
      name: args.name,
      description: args.description,
      isActive: args.isActive ?? true,
      triggers: args.triggers,
      steps: args.steps,
      totalTriggered: 0,
      totalDMsSent: 0,
      totalFailed: 0,
      createdAt: now,
      updatedAt: now,
    });

    return automationId;
  },
});

/**
 * Update an existing automation
 */
export const updateAutomation = mutation({
  args: {
    id: v.id("automations"),
    ...automationUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      throw new Error("Automation not found or access denied");
    }

    const { id, ...updateData } = args;

    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

/**
 * Delete an automation
 */
export const deleteAutomation = mutation({
  args: { id: v.id("automations") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      throw new Error("Automation not found or access denied");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

/**
 * Toggle automation active state
 */
export const toggleAutomation = mutation({
  args: { id: v.id("automations") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      throw new Error("Automation not found or access denied");
    }

    await ctx.db.patch(args.id, {
      isActive: !automation.isActive,
      updatedAt: getCurrentTimestamp(),
    });

    return !automation.isActive;
  },
});

// ============================================================================
// Session Functions (called by Lambda for multi-turn conversations)
// ============================================================================

/**
 * Get active session for a given automation + Instagram user (called by Lambda)
 */
export const getSessionForWebhook = query({
  args: {
    webhookSecret: v.string(),
    automationId: v.id("automations"),
    instagramUserId: v.string(),
  },
  returns: v.union(automationSessionSchema, v.null()),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      return null;
    }

    const session = await ctx.db
      .query("automationSessions")
      .withIndex("by_instagram_user", (q) =>
        q
          .eq("automationId", args.automationId)
          .eq("instagramUserId", args.instagramUserId)
          .eq("status", "active")
      )
      .first();

    return session;
  },
});

/**
 * Create a new automation session (called by Lambda)
 */
export const createSession = mutation({
  args: {
    webhookSecret: v.string(),
    automationId: v.id("automations"),
    userId: v.id("users"),
    instagramUserId: v.string(),
    instagramUsername: v.optional(v.string()),
    currentStepId: v.string(),
    triggerCommentId: v.optional(v.string()),
    triggerMediaId: v.optional(v.string()),
    variables: v.optional(v.any()),
  },
  returns: v.id("automationSessions"),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const now = getCurrentTimestamp();

    // Expire any existing active sessions for this user + automation
    const existingSessions = await ctx.db
      .query("automationSessions")
      .withIndex("by_instagram_user", (q) =>
        q
          .eq("automationId", args.automationId)
          .eq("instagramUserId", args.instagramUserId)
          .eq("status", "active")
      )
      .collect();

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, {
        status: "expired",
        lastActivityAt: now,
      });
    }

    return await ctx.db.insert("automationSessions", {
      automationId: args.automationId,
      userId: args.userId,
      instagramUserId: args.instagramUserId,
      instagramUsername: args.instagramUsername,
      currentStepId: args.currentStepId,
      triggerCommentId: args.triggerCommentId,
      triggerMediaId: args.triggerMediaId,
      status: "active",
      variables: args.variables,
      lastActivityAt: now,
      createdAt: now,
    });
  },
});

/**
 * Update an existing session (advance step or mark completed) (called by Lambda)
 */
export const updateSession = mutation({
  args: {
    webhookSecret: v.string(),
    sessionId: v.id("automationSessions"),
    currentStepId: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("completed"), v.literal("expired"))
    ),
    variables: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const now = getCurrentTimestamp();
    const patch: Record<string, unknown> = { lastActivityAt: now };

    if (args.currentStepId !== undefined) {
      patch.currentStepId = args.currentStepId;
    }
    if (args.status !== undefined) {
      patch.status = args.status;
    }
    if (args.variables !== undefined) {
      patch.variables = args.variables;
    }

    await ctx.db.patch(args.sessionId, patch);
    return null;
  },
});

/**
 * Upsert a contact (store/update email and collected data) (called by Lambda)
 */
export const upsertContact = mutation({
  args: {
    webhookSecret: v.string(),
    userId: v.id("users"),
    socialProviderId: v.id("socialProviders"),
    instagramUserId: v.string(),
    instagramUsername: v.optional(v.string()),
    email: v.optional(v.string()),
    collectedData: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    const now = getCurrentTimestamp();

    const existing = await ctx.db
      .query("automationContacts")
      .withIndex("by_instagram_user", (q) =>
        q
          .eq("socialProviderId", args.socialProviderId)
          .eq("instagramUserId", args.instagramUserId)
      )
      .first();

    if (existing) {
      const patch: Record<string, unknown> = { updatedAt: now };
      if (args.instagramUsername) {
        patch.instagramUsername = args.instagramUsername;
      }
      if (args.email) {
        patch.email = args.email;
      }
      if (args.collectedData) {
        patch.collectedData = args.collectedData;
      }
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("automationContacts", {
        userId: args.userId,
        socialProviderId: args.socialProviderId,
        instagramUserId: args.instagramUserId,
        instagramUsername: args.instagramUsername,
        email: args.email,
        collectedData: args.collectedData,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

/**
 * Check if a contact has email stored (called by Lambda for has_email condition)
 */
export const checkContactHasEmail = query({
  args: {
    webhookSecret: v.string(),
    socialProviderId: v.id("socialProviders"),
    instagramUserId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      return false;
    }

    const contact = await ctx.db
      .query("automationContacts")
      .withIndex("by_instagram_user", (q) =>
        q
          .eq("socialProviderId", args.socialProviderId)
          .eq("instagramUserId", args.instagramUserId)
      )
      .first();

    return !!contact?.email;
  },
});
