import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { getAuthContext, getAuthContextOrThrow } from "./lib/auth";
import { analyticsSyncStatusSchema } from "./schemas/analytics";
import { decryptData, getCurrentTimestamp } from "./utils";

// ============================================================================
// STALENESS CONFIG
// ============================================================================

const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours
const STALE_SYNCING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// HELPERS
// ============================================================================

/** Get midnight UTC timestamp for a given date */
function toMidnightUTC(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/** Verify the authenticated user owns this social provider */
async function assertProviderOwnership(
  ctx: QueryCtx,
  socialProviderId: Id<"socialProviders">
) {
  const authCtx = await getAuthContextOrThrow(ctx);
  const provider = await ctx.db.get(socialProviderId);
  if (!provider) {
    throw new Error("Social provider not found");
  }
  if (authCtx.organizationId) {
    if (provider.organizationId !== authCtx.organizationId) {
      throw new Error("Unauthorized");
    }
  } else if (
    provider.userId?.toString() !== authCtx.userId.toString() ||
    provider.organizationId
  ) {
    throw new Error("Unauthorized");
  }
}

/** Check if the user owns or has access to this social provider */
// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get account insights overview for a social provider.
 * Returns cached data + staleness flag so the frontend can trigger a sync if needed.
 */
export const getAccountOverview = query({
  args: {
    socialProviderId: v.id("socialProviders"),
    days: v.optional(v.number()), // default 30
  },
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return null;
    }

    const provider = await ctx.db.get(args.socialProviderId);
    if (!provider) {
      return null;
    }

    const days = args.days ?? 30;
    const now = getCurrentTimestamp();
    const startDate = toMidnightUTC(now - days * 24 * 60 * 60 * 1000);

    // Get sync state
    const syncState = await ctx.db
      .query("analyticsSyncState")
      .withIndex("by_social_provider_id", (q) =>
        q.eq("socialProviderId", args.socialProviderId)
      )
      .unique();

    // Check staleness
    const lastFetched = syncState?.lastAccountInsightsFetchedAt;
    const syncStatus = syncState?.syncStatus ?? "IDLE";

    // If stuck in SYNCING for too long, treat as stale
    const isStuckSyncing =
      syncStatus === "SYNCING" &&
      syncState?.updatedAt &&
      now - syncState.updatedAt > STALE_SYNCING_THRESHOLD_MS;

    const isStale =
      !lastFetched || now - lastFetched > STALE_THRESHOLD_MS || isStuckSyncing;

    // Fetch cached insights for the date range
    const insights = await ctx.db
      .query("accountInsights")
      .withIndex("by_provider_date", (q) =>
        q.eq("socialProviderId", args.socialProviderId).gte("date", startDate)
      )
      .collect();

    // Sort by date ascending for charts
    insights.sort((a, b) => a.date - b.date);

    // Calculate previous period for % change
    const prevStartDate = toMidnightUTC(startDate - days * 24 * 60 * 60 * 1000);
    const prevInsights = await ctx.db
      .query("accountInsights")
      .withIndex("by_provider_date", (q) =>
        q
          .eq("socialProviderId", args.socialProviderId)
          .gte("date", prevStartDate)
          .lt("date", startDate)
      )
      .collect();

    // Aggregate current period
    const currentTotals = aggregateAccountInsights(insights);
    const prevTotals = aggregateAccountInsights(prevInsights);

    return {
      insights,
      currentTotals,
      prevTotals,
      isStale,
      syncStatus: isStuckSyncing ? "IDLE" : syncStatus,
      lastSyncedAt: lastFetched,
      lastSyncError: syncState?.lastSyncError,
    };
  },
});

/**
 * Get the latest media insights for a social provider (top performing posts).
 */
export const getTopPosts = query({
  args: {
    socialProviderId: v.id("socialProviders"),
    sortBy: v.optional(v.string()), // "views" | "likes" | "engagement" | "comments"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return [];
    }

    const limit = args.limit ?? 25;
    const sortBy = args.sortBy ?? "views";
    const today = toMidnightUTC(getCurrentTimestamp());

    // Get the most recent snapshot date that has data
    const latestSnapshot = await ctx.db
      .query("mediaInsights")
      .withIndex("by_provider_snapshot", (q) =>
        q.eq("socialProviderId", args.socialProviderId)
      )
      .order("desc")
      .first();

    if (!latestSnapshot) {
      return [];
    }

    // Get all media insights for that snapshot date
    const mediaInsights = await ctx.db
      .query("mediaInsights")
      .withIndex("by_provider_snapshot", (q) =>
        q
          .eq("socialProviderId", args.socialProviderId)
          .eq("snapshotDate", latestSnapshot.snapshotDate)
      )
      .collect();

    // Sort by the requested metric
    mediaInsights.sort((a, b) => {
      const aVal = ((a as Record<string, unknown>)[sortBy] as number) ?? 0;
      const bVal = ((b as Record<string, unknown>)[sortBy] as number) ?? 0;
      return bVal - aVal;
    });

    return mediaInsights.slice(0, limit);
  },
});

/**
 * Get engagement timeline for a specific post (snapshots over time).
 */
export const getMediaInsightsTimeline = query({
  args: {
    socialProviderId: v.id("socialProviders"),
    platformPostId: v.string(),
  },
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return [];
    }

    const snapshots = await ctx.db
      .query("mediaInsights")
      .withIndex("by_provider_platform_post", (q) =>
        q
          .eq("socialProviderId", args.socialProviderId)
          .eq("platformPostId", args.platformPostId)
      )
      .collect();

    snapshots.sort((a, b) => a.snapshotDate - b.snapshotDate);
    return snapshots;
  },
});

/**
 * Get sync state for a social provider.
 */
export const getSyncState = query({
  args: {
    socialProviderId: v.id("socialProviders"),
  },
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return null;
    }

    return ctx.db
      .query("analyticsSyncState")
      .withIndex("by_social_provider_id", (q) =>
        q.eq("socialProviderId", args.socialProviderId)
      )
      .unique();
  },
});

// NOTE: triggerSync moved to tRPC (packages/api/router/analytics.ts)
// All Instagram API calls happen in tRPC, not Convex actions.

// ============================================================================
// INTERNAL MUTATIONS — Called by sync actions
// ============================================================================

/**
 * Store account-level insights (one row per day).
 * Upserts — if a row for the same provider+date exists, it patches.
 */
export const storeAccountInsights = mutation({
  args: {
    socialProviderId: v.id("socialProviders"),
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.string()),
    date: v.number(),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    followers: v.optional(v.number()),
    followersGained: v.optional(v.number()),
    profileViews: v.optional(v.number()),
    engagements: v.optional(v.number()),
    platformMetrics: v.optional(v.any()),
    fetchedAt: v.number(),
    fetchError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertProviderOwnership(ctx, args.socialProviderId);
    const existing = await ctx.db
      .query("accountInsights")
      .withIndex("by_provider_date", (q) =>
        q.eq("socialProviderId", args.socialProviderId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        impressions: args.impressions ?? existing.impressions,
        reach: args.reach ?? existing.reach,
        followers: args.followers ?? existing.followers,
        followersGained: args.followersGained ?? existing.followersGained,
        profileViews: args.profileViews ?? existing.profileViews,
        engagements: args.engagements ?? existing.engagements,
        platformMetrics: args.platformMetrics ?? existing.platformMetrics,
        fetchedAt: args.fetchedAt,
        fetchError: args.fetchError,
      });
    } else {
      await ctx.db.insert("accountInsights", args);
    }
  },
});

/**
 * Store media-level insights (one row per post per snapshot day).
 * Upserts — if a row for the same provider+platformPostId+snapshotDate exists, it patches.
 */
export const storeMediaInsights = mutation({
  args: {
    socialProviderId: v.id("socialProviders"),
    postId: v.optional(v.id("posts")),
    platformPostId: v.string(),
    // userId/organizationId passed for storage but auth checked via socialProviderId
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    permalink: v.optional(v.string()),
    caption: v.optional(v.string()),
    postedAt: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    views: v.optional(v.number()),
    reach: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
    engagement: v.optional(v.number()),
    platformMetrics: v.optional(v.any()),
    snapshotDate: v.number(),
    fetchedAt: v.number(),
    fetchError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertProviderOwnership(ctx, args.socialProviderId);
    const existing = await ctx.db
      .query("mediaInsights")
      .withIndex("by_provider_platform_post", (q) =>
        q
          .eq("socialProviderId", args.socialProviderId)
          .eq("platformPostId", args.platformPostId)
          .eq("snapshotDate", args.snapshotDate)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        views: args.views ?? existing.views,
        reach: args.reach ?? existing.reach,
        likes: args.likes ?? existing.likes,
        comments: args.comments ?? existing.comments,
        shares: args.shares ?? existing.shares,
        saves: args.saves ?? existing.saves,
        engagement: args.engagement ?? existing.engagement,
        platformMetrics: args.platformMetrics ?? existing.platformMetrics,
        mediaType: args.mediaType ?? existing.mediaType,
        permalink: args.permalink ?? existing.permalink,
        caption: args.caption ?? existing.caption,
        postedAt: args.postedAt ?? existing.postedAt,
        thumbnailUrl: args.thumbnailUrl ?? existing.thumbnailUrl,
        fetchedAt: args.fetchedAt,
        fetchError: args.fetchError,
      });
    } else {
      await ctx.db.insert("mediaInsights", args);
    }
  },
});

/**
 * Update sync state after a sync attempt.
 */
export const updateSyncState = mutation({
  args: {
    socialProviderId: v.id("socialProviders"),
    syncStatus: analyticsSyncStatusSchema,
    lastAccountInsightsFetchedAt: v.optional(v.number()),
    lastMediaInsightsFetchedAt: v.optional(v.number()),
    lastTokenRefreshedAt: v.optional(v.number()),
    lastSyncError: v.optional(v.string()),
    rateLimitResetAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertProviderOwnership(ctx, args.socialProviderId);
    const existing = await ctx.db
      .query("analyticsSyncState")
      .withIndex("by_social_provider_id", (q) =>
        q.eq("socialProviderId", args.socialProviderId)
      )
      .unique();

    const now = getCurrentTimestamp();
    const { socialProviderId, ...updates } = args;

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("analyticsSyncState", {
        socialProviderId,
        ...updates,
        updatedAt: now,
      });
    }
  },
});

// ============================================================================
// HELPERS
// ============================================================================

function aggregateAccountInsights(
  insights: Array<{
    impressions?: number;
    reach?: number;
    followers?: number;
    followersGained?: number;
    profileViews?: number;
    engagements?: number;
  }>
) {
  return {
    impressions: sum(insights, "impressions"),
    reach: sum(insights, "reach"),
    followersGained: sum(insights, "followersGained"),
    profileViews: sum(insights, "profileViews"),
    engagements: sum(insights, "engagements"),
    // Latest follower count (most recent day)
    followers: insights.at(-1)?.followers,
  };
}

function sum<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): number {
  return items.reduce((acc, item) => acc + ((item[key] as number) ?? 0), 0);
}

// ============================================================================
// INTERNAL QUERIES — Used by sync actions
// ============================================================================

/**
 * Get social provider with decrypted tokens (internal — no auth required).
 * Used by analytics_sync_actions.ts to get the access token for API calls.
 */
export const getProviderWithTokens = internalQuery({
  args: { socialProviderId: v.id("socialProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.socialProviderId);
    if (!provider?.isActive) {
      return null;
    }

    try {
      const accessToken = await decryptData(provider.accessToken);
      const refreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : undefined;
      return {
        ...provider,
        accessToken,
        refreshToken,
      };
    } catch {
      return null;
    }
  },
});

/**
 * Internal mutation to update a social provider's access token after refresh.
 */
export const updateProviderToken = mutation({
  args: {
    socialProviderId: v.id("socialProviders"),
    encryptedAccessToken: v.string(),
    expiresIn: v.number(),
  },
  handler: async (ctx, args) => {
    await assertProviderOwnership(ctx, args.socialProviderId);
    await ctx.db.patch(args.socialProviderId, {
      accessToken: args.encryptedAccessToken,
      expiresIn: args.expiresIn,
      updatedAt: Date.now(),
    });
  },
});
