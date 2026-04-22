import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  query,
} from "./_generated/server";
import { getAuthContext } from "./lib/auth";
import { kvDelete, kvPut, triggerKey } from "./lib/kv";
import { canManageSocials } from "./lib/permissions";
import {
  deleteAutomationMediaTriggers,
  syncAutomationMediaTriggers,
  type TriggerPair,
} from "./lib/trigger_index";
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
async function scheduleKvSync(ctx: MutationCtx, pairs: TriggerPair[]) {
  if (pairs.length === 0) {
    return;
  }
  await ctx.scheduler.runAfter(0, internal.automations.syncTriggerKvBatch, {
    pairs,
  });
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

    // 1. Indexed lookup on the denormalized trigger table. No .collect()
    //    over all of the provider's automations any more — we hit only the
    //    rows that actually target this mediaId.
    const triggerRows = await ctx.db
      .query("automationMediaTriggers")
      .withIndex("by_profile_media", (q) =>
        q.eq("profileId", args.instagramAccountId).eq("mediaId", args.mediaId)
      )
      .collect();

    const activeTriggerRows = triggerRows.filter((r) => r.isActive);
    if (activeTriggerRows.length === 0) {
      // Fast miss path — 90%+ of webhook events hit this.
      return null;
    }

    // 2. Load the actual automations + their owning provider.
    const automationDocs = await Promise.all(
      activeTriggerRows.map((row) => ctx.db.get(row.automationId))
    );
    const matchingAutomations = automationDocs.filter(
      (a): a is NonNullable<typeof a> => a?.isActive === true
    );
    if (matchingAutomations.length === 0) {
      return null;
    }

    const provider = await ctx.db.get(matchingAutomations[0].socialProviderId);
    if (!provider || provider.socialType !== "INSTAGRAM") {
      return null;
    }

    // 3. Get user + subscription for plan limits
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
 * Find the most recent active session for an Instagram user (called by Lambda)
 * Used for plain text message handling (email collection) where we don't know the automationId
 */
export const findActiveSessionByUser = query({
  args: {
    webhookSecret: v.string(),
    instagramUserId: v.string(),
  },
  returns: v.union(automationSessionSchema, v.null()),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      return null;
    }

    const session = await ctx.db
      .query("automationSessions")
      .withIndex("by_ig_user_status", (q) =>
        q.eq("instagramUserId", args.instagramUserId).eq("status", "active")
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
    const affected = await syncAutomationMediaTriggers(
      ctx,
      newAutomation,
      socialProvider.profileId
    );
    await scheduleKvSync(ctx, affected);

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
    const affected = await syncAutomationMediaTriggers(
      ctx,
      updated,
      provider?.profileId ?? null
    );
    await scheduleKvSync(ctx, affected);

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

    const affected = await deleteAutomationMediaTriggers(ctx, args.id);
    await ctx.db.delete(args.id);
    await scheduleKvSync(ctx, affected);
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
    const affected = await syncAutomationMediaTriggers(
      ctx,
      updated,
      provider?.profileId ?? null
    );
    await scheduleKvSync(ctx, affected);

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
        const affected = await syncAutomationMediaTriggers(
          ctx,
          refreshed,
          provider?.profileId ?? null
        );
        await scheduleKvSync(ctx, affected);
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
// KV Trigger Cache (Cloudflare Workers KV presence map for IG webhook gate)
// ============================================================================

const triggerPairValidator = v.object({
  profileId: v.string(),
  mediaId: v.string(),
});

/**
 * Returns true if any active automation targets (profileId, mediaId).
 * Called from the KV sync action to decide PUT vs DELETE.
 */
export const hasActiveTriggerForMedia = internalQuery({
  args: triggerPairValidator,
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("automationMediaTriggers")
      .withIndex("by_profile_media", (q) =>
        q.eq("profileId", args.profileId).eq("mediaId", args.mediaId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    return row !== null;
  },
});

/**
 * Push the KV cache for a batch of (profileId, mediaId) pairs. For each pair,
 * reads the current DB state and writes or deletes the KV key. Scheduled
 * async from automation mutations so the mutation itself doesn't block on
 * external HTTP.
 *
 * No-op (silently) if CF_* env vars aren't set — Lambda falls back to
 * calling Convex directly in that case.
 */
export const syncTriggerKvBatch = internalAction({
  args: { pairs: v.array(triggerPairValidator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const pair of args.pairs) {
      const isPresent = await ctx.runQuery(
        internal.automations.hasActiveTriggerForMedia,
        pair
      );
      const key = triggerKey(pair.profileId, pair.mediaId);
      if (isPresent) {
        await kvPut(key, "1");
      } else {
        await kvDelete(key);
      }
    }
    return null;
  },
});

/**
 * Backfill the KV cache from the current automationMediaTriggers table.
 * Safe to run any time — idempotent. Usage:
 *   npx convex run automations:backfillTriggerKv --prod
 */
export const backfillTriggerKv = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const pairs = await ctx.runQuery(
      internal.automations.listAllActiveTriggerPairs,
      {}
    );
    console.log(`[backfillTriggerKv] syncing ${pairs.length} keys to KV`);
    for (const pair of pairs) {
      await kvPut(triggerKey(pair.profileId, pair.mediaId), "1");
    }
    return null;
  },
});

/**
 * Return every distinct (profileId, mediaId) pair that currently has at
 * least one active trigger row. Used by the backfill action.
 */
export const listAllActiveTriggerPairs = internalQuery({
  args: {},
  returns: v.array(triggerPairValidator),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("automationMediaTriggers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    const seen = new Map<string, { profileId: string; mediaId: string }>();
    for (const row of rows) {
      seen.set(`${row.profileId}:${row.mediaId}`, {
        profileId: row.profileId,
        mediaId: row.mediaId,
      });
    }
    return [...seen.values()];
  },
});
