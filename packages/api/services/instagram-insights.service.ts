import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { encryptData } from "@delulu/database/convex/utils";
import { fetchMutation } from "@delulu/database/server";

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
// TYPES
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

interface SyncContext {
  socialProviderId: Id<"socialProviders">;
  profileId: string;
  accessToken: string;
  userId: Id<"users"> | undefined;
  organizationId: string | undefined;
  token: string; // Convex auth token for fetchMutation
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

export async function syncInstagramInsights(ctx: SyncContext): Promise<void> {
  const now = Date.now();
  const today = toMidnightUTC(now);

  // Check if token needs refresh (within 7 days of expiry)
  // Note: caller should pass provider.updatedAt + provider.expiresIn * 1000 check
  // Token refresh is handled by the caller if needed

  // 1. Fetch account-level insights (daily metrics)
  await fetchAndStoreAccountInsights(ctx);

  // 2. Fetch profile metadata (absolute follower count)
  await fetchAndStoreProfileMetadata(ctx, today);

  // 3. Fetch media list and per-media insights
  await fetchAndStoreMediaInsights(ctx, today);
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

export async function refreshInstagramToken(
  socialProviderId: Id<"socialProviders">,
  currentAccessToken: string,
  token: string
): Promise<void> {
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

  const encryptedToken = await encryptData(data.access_token);

  await fetchMutation(
    api.analytics.updateProviderToken,
    {
      socialProviderId,
      encryptedAccessToken: encryptedToken,
      expiresIn: data.expires_in,
    },
    { token }
  );
}

// ============================================================================
// INSTAGRAM API FETCH HELPERS
// ============================================================================

async function igFetch<T>(url: string, accessToken: string): Promise<T> {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}access_token=${accessToken}`);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Instagram API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

async function fetchAndStoreAccountInsights(ctx: SyncContext) {
  const data = await igFetch<{ data?: IGInsightMetric[] }>(
    `${IG_API_BASE}/${ctx.profileId}/insights?metric=${ACCOUNT_METRICS}&period=day`,
    ctx.accessToken
  );

  if (!data.data) {
    return;
  }

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

  const now = Date.now();
  for (const [endTime, metrics] of dayMap) {
    const date = toMidnightUTC(new Date(endTime).getTime());

    await fetchMutation(
      api.analytics.storeAccountInsights,
      {
        socialProviderId: ctx.socialProviderId,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
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
      },
      { token: ctx.token }
    );
  }
}

async function fetchAndStoreProfileMetadata(ctx: SyncContext, today: number) {
  const data = await igFetch<IGProfileData>(
    `${IG_API_BASE}/${ctx.profileId}?fields=${PROFILE_FIELDS}`,
    ctx.accessToken
  );

  await fetchMutation(
    api.analytics.storeAccountInsights,
    {
      socialProviderId: ctx.socialProviderId,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      date: today,
      followers: data.followers_count,
      platformMetrics: {
        totalFollowing: data.follows_count,
        totalMediaCount: data.media_count,
      },
      fetchedAt: Date.now(),
    },
    { token: ctx.token }
  );
}

async function fetchAndStoreMediaInsights(
  ctx: SyncContext,
  snapshotDate: number
) {
  const mediaData = await igFetch<{ data?: IGMediaItem[] }>(
    `${IG_API_BASE}/${ctx.profileId}/media?fields=${MEDIA_LIST_FIELDS}&limit=${MEDIA_LIST_LIMIT}`,
    ctx.accessToken
  );

  if (!mediaData.data || mediaData.data.length === 0) {
    return;
  }

  const now = Date.now();

  for (const media of mediaData.data) {
    const isReel = media.media_type === "VIDEO";
    const metricsParam = isReel ? REELS_METRICS : FEED_METRICS;

    try {
      const insightsData = await igFetch<{ data?: IGInsightMetric[] }>(
        `${IG_API_BASE}/${media.id}/insights?metric=${metricsParam}`,
        ctx.accessToken
      );

      const metrics: Record<string, number | undefined> = {};
      if (insightsData.data) {
        for (const metric of insightsData.data) {
          const value = metric.values[0]?.value;
          metrics[metric.name] = value;
        }
      }

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

      await fetchMutation(
        api.analytics.storeMediaInsights,
        {
          socialProviderId: ctx.socialProviderId,
          platformPostId: media.id,
          userId: ctx.userId,
          organizationId: ctx.organizationId,
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
            Object.keys(platformMetrics).length > 0
              ? platformMetrics
              : undefined,
          snapshotDate,
          fetchedAt: now,
        },
        { token: ctx.token }
      );
    } catch (error) {
      await fetchMutation(
        api.analytics.storeMediaInsights,
        {
          socialProviderId: ctx.socialProviderId,
          platformPostId: media.id,
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          mediaType: media.media_type,
          permalink: media.permalink,
          caption: media.caption?.slice(0, 300),
          postedAt: new Date(media.timestamp).getTime(),
          thumbnailUrl: media.thumbnail_url || media.media_url,
          snapshotDate,
          fetchedAt: now,
          fetchError:
            error instanceof Error ? error.message : "Failed to fetch insights",
        },
        { token: ctx.token }
      );
    }
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
