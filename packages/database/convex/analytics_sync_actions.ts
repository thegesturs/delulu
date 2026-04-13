"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { encryptData } from "./utils";

interface ActionCtx {
  // biome-ignore lint/suspicious/noExplicitAny: Convex action ctx.runMutation doesn't expose typed refs
  runMutation: (ref: any, args: any) => Promise<any>;
}

// ============================================================================
// INSTAGRAM GRAPH API v24.0 CONSTANTS
// ============================================================================

const IG_API_BASE = "https://graph.instagram.com/v24.0";

// Confirmed from live API — impressions is deprecated, use views instead
const ACCOUNT_METRICS =
  "views,reach,profile_views,follower_count,website_clicks,accounts_engaged,total_interactions,follows_and_unfollows";
const PROFILE_FIELDS = "followers_count,follows_count,media_count";
const MEDIA_LIST_FIELDS =
  "id,caption,media_type,timestamp,permalink,thumbnail_url,media_url";
const MEDIA_LIST_LIMIT = 25;

// Per-media-type metrics (v24 — impressions deprecated for media after July 2024)
const FEED_METRICS =
  "views,reach,likes,comments,saved,shares,total_interactions,follows,profile_visits";
const REELS_METRICS =
  "views,reach,likes,comments,saved,shares,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time";

// ============================================================================
// SYNC ACTION
// ============================================================================

/**
 * Main sync action — fetches insights from Instagram Graph API and stores them.
 * Called via ctx.scheduler.runAfter from the triggerSync mutation.
 */
export const syncInsights = internalAction({
  args: {
    socialProviderId: v.id("socialProviders"),
  },
  handler: async (ctx, args) => {
    const provider = await ctx.runQuery(
      internal.analytics.getProviderWithTokens,
      { socialProviderId: args.socialProviderId }
    );

    if (!provider) {
      await ctx.runMutation(internal.analytics.updateSyncState, {
        socialProviderId: args.socialProviderId,
        syncStatus: "TOKEN_EXPIRED",
        lastSyncError: "Provider not found or inactive",
      });
      return;
    }

    // Only handle Instagram for now
    if (provider.socialType !== "INSTAGRAM") {
      await ctx.runMutation(internal.analytics.updateSyncState, {
        socialProviderId: args.socialProviderId,
        syncStatus: "ERROR",
        lastSyncError: `Analytics sync not yet supported for ${provider.socialType}`,
      });
      return;
    }

    const now = Date.now();
    const today = toMidnightUTC(now);
    const accessToken = provider.accessToken;
    const profileId = provider.profileId;

    // Check if token needs refresh (within 7 days of expiry)
    const tokenExpiresAt = provider.updatedAt + provider.expiresIn * 1000;
    if (tokenExpiresAt - now < 7 * 24 * 60 * 60 * 1000) {
      await refreshToken(ctx, args.socialProviderId, accessToken);
    }

    try {
      // 1. Fetch account-level insights (daily metrics)
      await fetchAndStoreAccountInsights(
        ctx,
        args.socialProviderId,
        profileId,
        accessToken,
        provider.userId ?? undefined,
        provider.organizationId ?? undefined
      );

      // 2. Fetch profile metadata (absolute follower count)
      await fetchAndStoreProfileMetadata(
        ctx,
        args.socialProviderId,
        profileId,
        accessToken,
        today,
        provider.userId ?? undefined,
        provider.organizationId ?? undefined
      );

      // 3. Fetch media list and per-media insights
      await fetchAndStoreMediaInsights(
        ctx,
        args.socialProviderId,
        profileId,
        accessToken,
        today,
        provider.userId ?? undefined,
        provider.organizationId ?? undefined
      );

      // Update sync state to success
      await ctx.runMutation(internal.analytics.updateSyncState, {
        socialProviderId: args.socialProviderId,
        syncStatus: "IDLE",
        lastAccountInsightsFetchedAt: now,
        lastMediaInsightsFetchedAt: now,
        lastSyncError: undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for specific error types
      if (
        errorMessage.includes("OAuthException") ||
        errorMessage.includes("190")
      ) {
        await ctx.runMutation(internal.analytics.updateSyncState, {
          socialProviderId: args.socialProviderId,
          syncStatus: "TOKEN_EXPIRED",
          lastSyncError: errorMessage,
        });
      } else if (
        errorMessage.includes("429") ||
        errorMessage.includes("rate")
      ) {
        await ctx.runMutation(internal.analytics.updateSyncState, {
          socialProviderId: args.socialProviderId,
          syncStatus: "RATE_LIMITED",
          lastSyncError: errorMessage,
          rateLimitResetAt: now + 60 * 60 * 1000, // 1 hour default
        });
      } else {
        await ctx.runMutation(internal.analytics.updateSyncState, {
          socialProviderId: args.socialProviderId,
          syncStatus: "ERROR",
          lastSyncError: errorMessage,
        });
      }
    }
  },
});

// ============================================================================
// INSTAGRAM API FETCH HELPERS
// ============================================================================

interface IGInsightValue {
  value: number;
  end_time?: string;
}

interface IGInsightMetric {
  name: string;
  period: string;
  values: IGInsightValue[];
}

interface IGMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
}

interface IGProfileData {
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

async function igFetch<T>(url: string, accessToken: string): Promise<T> {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}access_token=${accessToken}`);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Instagram API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch account-level insights and store daily snapshots.
 */
async function fetchAndStoreAccountInsights(
  ctx: ActionCtx,
  socialProviderId: Id<"socialProviders">,
  profileId: string,
  accessToken: string,
  userId: Id<"users"> | undefined,
  organizationId: string | undefined
) {
  const data = await igFetch<{ data?: IGInsightMetric[] }>(
    `${IG_API_BASE}/${profileId}/insights?metric=${ACCOUNT_METRICS}&period=day`,
    accessToken
  );

  if (!data.data) {
    return;
  }

  // Group values by end_time to create per-day rows
  const dayMap = new Map<
    string,
    {
      impressions?: number;
      reach?: number;
      profileViews?: number;
      followersGained?: number;
      engagements?: number;
      websiteClicks?: number;
      accountsEngaged?: number;
      followsAndUnfollows?: number;
    }
  >();

  for (const metric of data.data) {
    for (const val of metric.values) {
      if (!val.end_time) {
        continue;
      }
      const key = val.end_time;
      const day = dayMap.get(key) ?? {};

      if (metric.name === "views") {
        day.impressions = val.value;
      }
      if (metric.name === "reach") {
        day.reach = val.value;
      }
      if (metric.name === "profile_views") {
        day.profileViews = val.value;
      }
      if (metric.name === "follower_count") {
        day.followersGained = val.value;
      }
      if (metric.name === "total_interactions") {
        day.engagements = val.value;
      }
      if (metric.name === "website_clicks") {
        day.websiteClicks = val.value;
      }
      if (metric.name === "accounts_engaged") {
        day.accountsEngaged = val.value;
      }
      if (metric.name === "follows_and_unfollows") {
        day.followsAndUnfollows = val.value;
      }

      dayMap.set(key, day);
    }
  }

  // Store each day's snapshot
  const now = Date.now();
  for (const [endTime, metrics] of dayMap) {
    const date = toMidnightUTC(new Date(endTime).getTime());

    await ctx.runMutation(internal.analytics.storeAccountInsights, {
      socialProviderId,
      userId,
      organizationId,
      date,
      impressions: metrics.impressions,
      reach: metrics.reach,
      profileViews: metrics.profileViews,
      followersGained: metrics.followersGained,
      engagements: metrics.engagements,
      platformMetrics: {
        websiteClicks: metrics.websiteClicks,
        accountsEngaged: metrics.accountsEngaged,
        followsAndUnfollows: metrics.followsAndUnfollows,
      },
      fetchedAt: now,
    });
  }
}

/**
 * Fetch profile metadata (absolute follower/following counts) and update today's snapshot.
 */
async function fetchAndStoreProfileMetadata(
  ctx: ActionCtx,
  socialProviderId: Id<"socialProviders">,
  profileId: string,
  accessToken: string,
  today: number,
  userId: Id<"users"> | undefined,
  organizationId: string | undefined
) {
  const data = await igFetch<IGProfileData>(
    `${IG_API_BASE}/${profileId}?fields=${PROFILE_FIELDS}`,
    accessToken
  );

  await ctx.runMutation(internal.analytics.storeAccountInsights, {
    socialProviderId,
    userId,
    organizationId,
    date: today,
    followers: data.followers_count,
    platformMetrics: {
      totalFollowing: data.follows_count,
      totalMediaCount: data.media_count,
    },
    fetchedAt: Date.now(),
  });
}

/**
 * Fetch media list and per-media insights.
 */
async function fetchAndStoreMediaInsights(
  ctx: ActionCtx,
  socialProviderId: Id<"socialProviders">,
  profileId: string,
  accessToken: string,
  snapshotDate: number,
  userId: Id<"users"> | undefined,
  organizationId: string | undefined
) {
  // Fetch media list
  const mediaData = await igFetch<{ data?: IGMediaItem[] }>(
    `${IG_API_BASE}/${profileId}/media?fields=${MEDIA_LIST_FIELDS}&limit=${MEDIA_LIST_LIMIT}`,
    accessToken
  );

  if (!mediaData.data || mediaData.data.length === 0) {
    return;
  }

  const now = Date.now();

  // Fetch insights for each media item
  for (const media of mediaData.data) {
    // Use correct metrics based on media type
    // Instagram returns reels as media_type "VIDEO"
    const isReel = media.media_type === "VIDEO";
    const metricsParam = isReel ? REELS_METRICS : FEED_METRICS;

    try {
      const insightsData = await igFetch<{ data?: IGInsightMetric[] }>(
        `${IG_API_BASE}/${media.id}/insights?metric=${metricsParam}`,
        accessToken
      );

      // Extract metric values
      const metrics: Record<string, number | undefined> = {};
      if (insightsData.data) {
        for (const metric of insightsData.data) {
          const value = metric.values[0]?.value;
          metrics[metric.name] = value;
        }
      }

      // Build platform-specific metrics for reels
      const platformMetrics: Record<string, number | undefined> = {};
      if (media.media_type === "VIDEO") {
        platformMetrics.avgWatchTime = metrics.ig_reels_avg_watch_time;
        platformMetrics.totalViewTime = metrics.ig_reels_video_view_total_time;
      }
      if (metrics.follows !== undefined) {
        platformMetrics.follows = metrics.follows;
      }
      if (metrics.profile_visits !== undefined) {
        platformMetrics.profileVisits = metrics.profile_visits;
      }

      await ctx.runMutation(internal.analytics.storeMediaInsights, {
        socialProviderId,
        platformPostId: media.id,
        userId,
        organizationId,
        mediaType: media.media_type,
        permalink: media.permalink,
        caption: media.caption?.slice(0, 300),
        postedAt: new Date(media.timestamp).getTime(),
        thumbnailUrl: media.thumbnail_url || media.media_url,
        views: metrics.views,
        reach: metrics.reach,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        saves: metrics.saved,
        engagement: metrics.total_interactions,
        platformMetrics:
          Object.keys(platformMetrics).length > 0 ? platformMetrics : undefined,
        snapshotDate,
        fetchedAt: now,
      });
    } catch (error) {
      // Store the error but continue with other media
      await ctx.runMutation(internal.analytics.storeMediaInsights, {
        socialProviderId,
        platformPostId: media.id,
        userId,
        organizationId,
        mediaType: media.media_type,
        permalink: media.permalink,
        caption: media.caption?.slice(0, 300),
        postedAt: new Date(media.timestamp).getTime(),
        thumbnailUrl: media.thumbnail_url || media.media_url,
        snapshotDate,
        fetchedAt: now,
        fetchError:
          error instanceof Error ? error.message : "Failed to fetch insights",
      });
    }
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

async function refreshToken(
  ctx: ActionCtx,
  socialProviderId: Id<"socialProviders">,
  currentAccessToken: string
) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentAccessToken}`
    );

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return;
    }

    const data = (await response.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    // Encrypt the new token and update the provider
    const encryptedToken = await encryptData(data.access_token);

    await ctx.runMutation(internal.analytics.updateSyncState, {
      socialProviderId,
      syncStatus: "SYNCING", // Stay in syncing state
      lastTokenRefreshedAt: Date.now(),
    });

    // Update the social provider with new token
    await ctx.runMutation(internal.analytics.updateProviderToken, {
      socialProviderId,
      encryptedAccessToken: encryptedToken,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
  }
}

// ============================================================================
// UTILS
// ============================================================================

function toMidnightUTC(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}
