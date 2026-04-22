import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  query,
} from "./_generated/server";
import { getAuthContext } from "./lib/auth";
import { kvDelete, kvGet, kvPut, sessionKey, triggerKey } from "./lib/kv";
import { canManageSocials } from "./lib/permissions";
import {
  deleteAutomationMediaTriggers,
  syncAutomationMediaTriggers,
  type TriggerPair,
} from "./lib/trigger_index";
import {
  sessionOp,
  type TriggerKvOp,
  triggerDiff,
} from "./lib/trigger_kv_sync";
import { resolveUsageOwnerFromDoc } from "./lib/usage";
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

// Best-effort KV cache sync. Scheduled async so it doesn't block the
// mutation. If CF_* env vars aren't set, the action no-ops silently.
/**
 * Schedule KV writes for a batch of trigger ops produced by `triggerDiff`.
 * No-op when the list is empty so mutations that didn't touch triggers
 * don't fire the action.
 */
async function scheduleTriggerKv(ctx: MutationCtx, ops: TriggerKvOp[]) {
  if (ops.length === 0) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.automations.syncTriggerKvBatch, {
    ops,
  });
}

/**
 * Schedule a single session KV op (or no-op if null). Used from
 * createSession / updateSession after the DB write.
 */
async function scheduleSessionKv(
  ctx: MutationCtx,
  op: ReturnType<typeof sessionOp>
) {
  if (!op) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.automations.syncSessionKv, { op });
}

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
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
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
    } else if (authCtx.organizationId) {
      automations = await ctx.db
        .query("automations")
        .withIndex("by_organization_id", (q) =>
          q.eq("organizationId", authCtx.organizationId)
        )
        .collect();
    } else {
      automations = await ctx.db
        .query("automations")
        .withIndex("by_user_id", (q) => q.eq("userId", authCtx.userId))
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
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return null;
    }

    const automation = await ctx.db.get(args.id);
    const ownsPersonal = automation?.userId === authCtx.userId;
    const ownsViaOrg =
      automation?.organizationId &&
      automation.organizationId === authCtx.organizationId;
    if (!(automation && (ownsPersonal || ownsViaOrg))) {
      return null;
    }

    return automation;
  },
});

/**
 * Get automations + access token + usage for webhook processing (called by Lambda)
 *
 * Two call shapes:
 *  - Fast path: `automationIds` is provided (from the CF KV cache hit).
 *    We just ctx.db.get each, resolve the provider from the first, return.
 *  - Fallback: `instagramAccountId` + `mediaId` are provided. Used when the
 *    Lambda can't reach CF KV. We do a .collect() + JS filter across all
 *    active automations for the provider — correct but slow. This path
 *    should see very little traffic once KV is healthy.
 */
export const getForWebhook = query({
  args: {
    webhookSecret: v.string(),
    // Fast path — Lambda passes this after a KV hit.
    automationIds: v.optional(v.array(v.id("automations"))),
    // Fallback path — original signature. Kept so a broken KV gate doesn't
    // drop automation events.
    instagramAccountId: v.optional(v.string()),
    mediaId: v.optional(v.string()),
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
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      console.log("[getForWebhook] Secret mismatch");
      return null;
    }

    let matchingAutomations: Doc<"automations">[] = [];

    if (args.automationIds && args.automationIds.length > 0) {
      // Fast path. KV already told us which automations target this media.
      const docs = await Promise.all(
        args.automationIds.map((id) => ctx.db.get(id))
      );
      matchingAutomations = docs.filter(
        (a): a is NonNullable<typeof a> => a?.isActive === true
      );
    } else if (args.instagramAccountId && args.mediaId) {
      // Legacy fallback for when KV is unreachable. Scan + JS filter.
      console.log(
        `[getForWebhook] fallback path mediaId=${args.mediaId} — KV unavailable`
      );
      const provider = await ctx.db
        .query("socialProviders")
        .withIndex("by_profile_id", (q) =>
          q.eq("profileId", args.instagramAccountId as string)
        )
        .first();
      if (!provider || provider.socialType !== "INSTAGRAM") {
        return null;
      }
      const mediaId = args.mediaId;
      const allForProvider = await ctx.db
        .query("automations")
        .withIndex("by_social_provider_active", (q) =>
          q.eq("socialProviderId", provider._id).eq("isActive", true)
        )
        .collect();
      matchingAutomations = allForProvider.filter((a) =>
        a.triggers.some((t) => t.targetPostIds.includes(mediaId))
      );
    } else {
      console.log(
        "[getForWebhook] missing both automationIds and fallback args"
      );
      return null;
    }

    if (matchingAutomations.length === 0) {
      return null;
    }

    const provider = await ctx.db.get(matchingAutomations[0].socialProviderId);
    if (!provider || provider.socialType !== "INSTAGRAM") {
      return null;
    }

    const ownerId = await resolveUsageOwnerFromDoc(ctx, provider);
    if (!ownerId) {
      return null;
    }
    const user = await ctx.db.get(ownerId);
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
 * Find the active session for an Instagram user (called by Lambda).
 *
 * Two call shapes, mirroring getForWebhook:
 *  - Fast path: `sessionId` from the KV cache hit. We ctx.db.get and
 *    verify it's still active.
 *  - Fallback: `instagramUserId` scan (old signature). Used when KV is
 *    unreachable.
 */
export const findActiveSessionByUser = query({
  args: {
    webhookSecret: v.string(),
    sessionId: v.optional(v.id("automationSessions")),
    instagramUserId: v.optional(v.string()),
  },
  returns: v.union(automationSessionSchema, v.null()),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      return null;
    }

    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (session && session.status === "active") {
        return session;
      }
      return null;
    }

    if (!args.instagramUserId) {
      return null;
    }

    const session = await ctx.db
      .query("automationSessions")
      .withIndex("by_ig_user_status", (q) =>
        q
          .eq("instagramUserId", args.instagramUserId as string)
          .eq("status", "active")
      )
      .order("desc")
      .first();

    return session;
  },
});

/**
 * Get provider data for webhook processing without mediaId filtering (called by Lambda)
 * Used for text message handling where we only know the Instagram account ID
 */
export const getProviderDataForWebhook = query({
  args: {
    webhookSecret: v.string(),
    instagramAccountId: v.string(),
  },
  returns: v.union(
    v.object({
      accessToken: v.string(),
      profileId: v.string(),
      userId: v.id("users"),
      socialProviderId: v.id("socialProviders"),
      planType: v.union(
        v.literal("FREE"),
        v.literal("VIBE"),
        v.literal("ECHO")
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      return null;
    }

    const provider = await ctx.db
      .query("socialProviders")
      .withIndex("by_profile_id", (q) =>
        q.eq("profileId", args.instagramAccountId)
      )
      .first();

    if (!provider || provider.socialType !== "INSTAGRAM") {
      return null;
    }

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

    const accessToken = await decryptData(provider.accessToken);

    return {
      accessToken,
      profileId: provider.profileId,
      userId: user._id,
      socialProviderId: provider._id,
      planType,
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
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      throw new Error("User not found");
    }
    if (!canManageSocials(authCtx)) {
      throw new Error("You do not have permission to manage automations");
    }

    // Verify user owns the social provider (or it belongs to their active org)
    const socialProvider = await ctx.db.get(args.socialProviderId);
    const ownsPersonal = socialProvider?.userId === authCtx.userId;
    const ownsViaOrg =
      socialProvider?.organizationId &&
      socialProvider.organizationId === authCtx.organizationId;
    if (!(socialProvider && (ownsPersonal || ownsViaOrg))) {
      throw new Error("Social provider not found or access denied");
    }

    // Only allow Instagram providers
    if (socialProvider.socialType !== "INSTAGRAM") {
      throw new Error("Automations are only supported for Instagram accounts");
    }

    const now = getCurrentTimestamp();

    const automationId = await ctx.db.insert("automations", {
      userId: authCtx.organizationId ? undefined : authCtx.userId,
      organizationId: authCtx.organizationId ?? args.organizationId,
      socialProviderId: args.socialProviderId,
      name: args.name,
      description: args.description,
      isActive: args.isActive ?? true,
      triggers: args.triggers,
      steps: args.steps,
      notes: args.notes,
      nodePositions: args.nodePositions,
      totalTriggered: 0,
      totalDMsSent: 0,
      totalFailed: 0,
      createdAt: now,
      updatedAt: now,
    });

    const newAutomation = await ctx.db.get(automationId);
    const ops = triggerDiff(null, newAutomation, socialProvider.profileId);
    await scheduleTriggerKv(ctx, ops);

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
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      throw new Error("User not found");
    }
    if (!canManageSocials(authCtx)) {
      throw new Error("You do not have permission to manage automations");
    }

    const automation = await ctx.db.get(args.id);
    const ownsPersonal = automation?.userId === authCtx.userId;
    const ownsViaOrg =
      automation?.organizationId &&
      automation.organizationId === authCtx.organizationId;
    if (!(automation && (ownsPersonal || ownsViaOrg))) {
      throw new Error("Automation not found or access denied");
    }

    const { id, ...updateData } = args;

    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: getCurrentTimestamp(),
    });

    const updated = await ctx.db.get(args.id);
    const provider = updated
      ? await ctx.db.get(updated.socialProviderId)
      : null;
    const ops = triggerDiff(automation, updated, provider?.profileId ?? null);
    await scheduleTriggerKv(ctx, ops);

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
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      throw new Error("User not found");
    }
    if (!canManageSocials(authCtx)) {
      throw new Error("You do not have permission to manage automations");
    }

    const automation = await ctx.db.get(args.id);
    const ownsPersonal = automation?.userId === authCtx.userId;
    const ownsViaOrg =
      automation?.organizationId &&
      automation.organizationId === authCtx.organizationId;
    if (!(automation && (ownsPersonal || ownsViaOrg))) {
      throw new Error("Automation not found or access denied");
    }

    const provider = await ctx.db.get(automation.socialProviderId);
    const ops = triggerDiff(automation, null, provider?.profileId ?? null);
    await ctx.db.delete(args.id);
    await scheduleTriggerKv(ctx, ops);
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
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      throw new Error("User not found");
    }

    const automation = await ctx.db.get(args.id);
    const ownsPersonal = automation?.userId === authCtx.userId;
    const ownsViaOrg =
      automation?.organizationId &&
      automation.organizationId === authCtx.organizationId;
    if (!(automation && (ownsPersonal || ownsViaOrg))) {
      throw new Error("Automation not found or access denied");
    }

    await ctx.db.patch(args.id, {
      isActive: !automation.isActive,
      updatedAt: getCurrentTimestamp(),
    });

    const updated = await ctx.db.get(args.id);
    const provider = updated
      ? await ctx.db.get(updated.socialProviderId)
      : null;
    const ops = triggerDiff(automation, updated, provider?.profileId ?? null);
    await scheduleTriggerKv(ctx, ops);

    return !automation.isActive;
  },
});

/**
 * Link a published post's Instagram media ID to automations that were waiting for it.
 * Called internally after a scheduled post is successfully published.
 */
export const linkPublishedPost = internalMutation({
  args: {
    convexPostId: v.id("posts"),
    instagramMediaId: v.string(),
    socialProviderId: v.id("socialProviders"),
  },
  handler: async (ctx, args) => {
    // Find all active automations for this social provider
    const automations = await ctx.db
      .query("automations")
      .withIndex("by_social_provider_active", (q) =>
        q.eq("socialProviderId", args.socialProviderId).eq("isActive", true)
      )
      .collect();

    // Also check inactive automations that might have pending post IDs
    const inactiveAutomations = await ctx.db
      .query("automations")
      .withIndex("by_social_provider_id", (q) =>
        q.eq("socialProviderId", args.socialProviderId)
      )
      .collect();

    const allAutomations = [
      ...automations,
      ...inactiveAutomations.filter(
        (a) => !automations.some((active) => active._id === a._id)
      ),
    ];

    for (const automation of allAutomations) {
      let updated = false;
      const newTriggers = automation.triggers.map((trigger) => {
        const pendingIds = trigger.pendingPostIds || [];
        if (pendingIds.includes(args.convexPostId)) {
          updated = true;
          return {
            ...trigger,
            targetPostIds: [...trigger.targetPostIds, args.instagramMediaId],
            pendingPostIds: pendingIds.filter((id) => id !== args.convexPostId),
          };
        }
        return trigger;
      });

      if (updated) {
        await ctx.db.patch(automation._id, {
          triggers: newTriggers,
          updatedAt: getCurrentTimestamp(),
        });
        const refreshed = await ctx.db.get(automation._id);
        const provider = refreshed
          ? await ctx.db.get(refreshed.socialProviderId)
          : null;
        const ops = triggerDiff(
          automation,
          refreshed,
          provider?.profileId ?? null
        );
        await scheduleTriggerKv(ctx, ops);
      }
    }
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

    const sessionId = await ctx.db.insert("automationSessions", {
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

    const newSession = await ctx.db.get(sessionId);
    await scheduleSessionKv(ctx, sessionOp(null, newSession));

    return sessionId;
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

    const oldSession = await ctx.db.get(args.sessionId);
    await ctx.db.patch(args.sessionId, patch);
    // Merge locally to avoid a second ctx.db.get — patch isn't reactive here
    // and merging the known patch over the old doc is equivalent.
    const updatedSession = oldSession
      ? ({ ...oldSession, ...patch } as Doc<"automationSessions">)
      : null;
    await scheduleSessionKv(ctx, sessionOp(oldSession, updatedSession));

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

// ============================================================================
// Trigger Index Backfill
// ============================================================================

/**
 * Backfill the automationMediaTriggers table from existing automations.
 * Idempotent — safe to re-run. Call this once after deploying the new schema
 * so existing automations start routing through the fast path.
 *
 * Usage: `npx convex run automations:backfillTriggerIndex --prod`
 */
export const backfillTriggerIndex = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    totalProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 200;
    let processed = args.totalProcessed ?? 0;

    const results = await ctx.db.query("automations").paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ?? null,
    });

    for (const automation of results.page) {
      const provider = await ctx.db.get(automation.socialProviderId);
      await syncAutomationMediaTriggers(
        ctx,
        automation,
        provider?.profileId ?? null
      );
      processed++;
    }

    if (results.isDone) {
      console.log(
        `[backfillTriggerIndex] Done. Total automations processed: ${processed}`
      );
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.automations.backfillTriggerIndex,
        {
          cursor: results.continueCursor,
          totalProcessed: processed,
        }
      );
      console.log(`[backfillTriggerIndex] ${processed} so far, continuing...`);
    }
  },
});

// ============================================================================
// KV Trigger Cache — CF KV is the sole (profileId, mediaId) → automationIds
// index. Convex is the source of truth; the mutations compute the diff and
// schedule RMW ops here so Lambda can short-circuit on misses without ever
// reaching Convex.
// ============================================================================

const triggerKvOpValidator = v.object({
  op: v.union(v.literal("add"), v.literal("remove")),
  profileId: v.string(),
  mediaId: v.string(),
  automationId: v.id("automations"),
});

const sessionKvOpValidator = v.object({
  op: v.union(v.literal("put"), v.literal("delete")),
  instagramUserId: v.string(),
  sessionId: v.optional(v.id("automationSessions")),
});

interface TriggerKvValue {
  automationIds: string[];
}

function parseTriggerValue(raw: string): TriggerKvValue {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as TriggerKvValue).automationIds)
    ) {
      return { automationIds: (parsed as TriggerKvValue).automationIds };
    }
  } catch {
    // Old presence-bit format ("1") or garbage — treat as empty so the add
    // path writes a clean JSON value over it.
  }
  return { automationIds: [] };
}

/**
 * Apply a batch of trigger KV ops (add/remove an automationId from
 * `trig:{profileId}:{mediaId}`). Uses read-modify-write. Safe if CF env is
 * unset — the underlying kv helpers are no-ops, so this just logs and exits.
 *
 * Concurrent mutations targeting the same key can race (last write wins).
 * Worst case: a key is briefly out of sync. Run `rebuildTriggerKv` or
 * `backfillTriggerKv` to heal if that ever happens in practice.
 */
export const syncTriggerKvBatch = internalAction({
  args: { ops: v.array(triggerKvOpValidator) },
  returns: v.null(),
  handler: async (_ctx, args) => {
    for (const op of args.ops) {
      const key = triggerKey(op.profileId, op.mediaId);
      const raw = await kvGet(key);
      if (raw === "error") {
        // KV unavailable — bail, caller-side fallback handles the webhook.
        continue;
      }
      const value =
        raw === null ? { automationIds: [] } : parseTriggerValue(raw);
      const set = new Set(value.automationIds);
      if (op.op === "add") {
        set.add(op.automationId);
      } else {
        set.delete(op.automationId);
      }
      if (set.size === 0) {
        await kvDelete(key);
      } else {
        await kvPut(key, JSON.stringify({ automationIds: [...set] }));
      }
    }
    return null;
  },
});

/**
 * Apply a session KV op. PUT writes `sess:{instagramUserId}` with the
 * sessionId; DELETE removes the key. Called from createSession /
 * updateSession mutations.
 */
export const syncSessionKv = internalAction({
  args: { op: sessionKvOpValidator },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const key = sessionKey(args.op.instagramUserId);
    if (args.op.op === "delete") {
      await kvDelete(key);
    } else if (args.op.sessionId) {
      await kvPut(key, JSON.stringify({ sessionId: args.op.sessionId }));
    }
    return null;
  },
});

/**
 * Read every active automation and push its trigger KV state from scratch.
 * Rebuilds the JSON value per `(profileId, mediaId)` with all targeting
 * automationIds. Safe to re-run.
 *
 *   npx convex run automations:backfillTriggerKv --prod
 */
export const backfillTriggerKv = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const map = await ctx.runQuery(internal.automations.buildTriggerKvMap, {});
    console.log(`[backfillTriggerKv] syncing ${map.length} keys to KV`);
    for (const entry of map) {
      await kvPut(
        triggerKey(entry.profileId, entry.mediaId),
        JSON.stringify({ automationIds: entry.automationIds })
      );
    }
    return null;
  },
});

/**
 * Seed the session KV cache from the current active sessions. Useful the
 * first time this ships — subsequent session writes maintain KV on their own.
 *
 *   npx convex run automations:backfillSessionKv --prod
 */
export const backfillSessionKv = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const entries = await ctx.runQuery(
      internal.automations.listActiveSessions,
      {}
    );
    console.log(`[backfillSessionKv] syncing ${entries.length} keys to KV`);
    for (const entry of entries) {
      await kvPut(
        sessionKey(entry.instagramUserId),
        JSON.stringify({ sessionId: entry.sessionId })
      );
    }
    return null;
  },
});

/**
 * Walk every active automation, join its socialProvider's profileId, and
 * produce the full `(profileId, mediaId) → automationIds` map. Used by the
 * backfill action. Reads come off existing indexes — no extra tables.
 *
 * Runs a single .collect() over the active-automation set. Fine at today's
 * scale (< 10K active automations); if that grows past Convex's ~8 MB read
 * budget or the action timeout, switch this to a paginated variant that
 * streams batches to kvPut.
 */
export const buildTriggerKvMap = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      profileId: v.string(),
      mediaId: v.string(),
      automationIds: v.array(v.id("automations")),
    })
  ),
  handler: async (ctx) => {
    const automations = await ctx.db
      .query("automations")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .collect();

    // Cache provider lookups to avoid duplicate gets per provider.
    const providerCache = new Map<string, Doc<"socialProviders"> | null>();
    const map = new Map<
      string,
      {
        profileId: string;
        mediaId: string;
        automationIds: Id<"automations">[];
      }
    >();

    for (const automation of automations) {
      let provider = providerCache.get(automation.socialProviderId);
      if (provider === undefined) {
        provider = await ctx.db.get(automation.socialProviderId);
        providerCache.set(automation.socialProviderId, provider);
      }
      if (!provider || provider.socialType !== "INSTAGRAM") {
        continue;
      }
      const mediaIds = new Set<string>();
      for (const trigger of automation.triggers) {
        for (const id of trigger.targetPostIds ?? []) {
          mediaIds.add(id);
        }
      }
      for (const mediaId of mediaIds) {
        const key = `${provider.profileId}:${mediaId}`;
        let entry = map.get(key);
        if (!entry) {
          entry = {
            profileId: provider.profileId,
            mediaId,
            automationIds: [],
          };
          map.set(key, entry);
        }
        entry.automationIds.push(automation._id);
      }
    }
    return [...map.values()];
  },
});

/**
 * List every active session, one per instagramUserId (most recent if more
 * than one exists defensively). Same `.collect()` caveat as
 * `buildTriggerKvMap` — bounded by today's active-session count, paginate
 * if that balloons.
 */
export const listActiveSessions = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      instagramUserId: v.string(),
      sessionId: v.id("automationSessions"),
    })
  ),
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("automationSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const best = new Map<
      string,
      { instagramUserId: string; sessionId: string; lastActivityAt: number }
    >();
    for (const session of sessions) {
      const existing = best.get(session.instagramUserId);
      if (!existing || session.lastActivityAt > existing.lastActivityAt) {
        best.set(session.instagramUserId, {
          instagramUserId: session.instagramUserId,
          sessionId: session._id,
          lastActivityAt: session.lastActivityAt,
        });
      }
    }
    return [...best.values()].map((b) => ({
      instagramUserId: b.instagramUserId,
      sessionId: b.sessionId as Id<"automationSessions">,
    }));
  },
});
