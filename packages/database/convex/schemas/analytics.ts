import { v } from "convex/values";

// ============================================================================
// ANALYTICS SCHEMAS (Platform-Agnostic)
// ============================================================================

// Sync status enum
export const analyticsSyncStatusSchema = v.union(
  v.literal("IDLE"),
  v.literal("SYNCING"),
  v.literal("ERROR"),
  v.literal("RATE_LIMITED"),
  v.literal("TOKEN_EXPIRED")
);

// ============================================================================
// ACCOUNT INSIGHTS — One row per social account per day
// Powers: trend charts, follower growth, engagement over time
// ============================================================================

export const baseAccountInsightsSchema = v.object({
  socialProviderId: v.id("socialProviders"),
  userId: v.optional(v.id("users")),
  organizationId: v.optional(v.string()),

  // Date this snapshot represents (midnight UTC timestamp)
  date: v.number(),

  // Common metrics across platforms (normalized names)
  // IG: impressions | YT: views | TT: video_views
  impressions: v.optional(v.number()),
  // IG: reach (unique accounts) | Others: may not have
  reach: v.optional(v.number()),
  // Absolute follower count snapshot
  followers: v.optional(v.number()),
  // Net new followers this day
  followersGained: v.optional(v.number()),
  // IG: profile_views | YT: channel views
  profileViews: v.optional(v.number()),
  // Total engagement actions this day
  engagements: v.optional(v.number()),

  // Platform-specific metrics blob — flexible per platform
  // IG: { websiteClicks, accountsEngaged, totalFollowing, totalMediaCount }
  // YT: { subscribersGained, subscribersLost, estimatedMinutesWatched, averageViewDuration }
  // TT: { videoViews, likes, shares, comments }
  platformMetrics: v.optional(v.any()),

  fetchedAt: v.number(),
  fetchError: v.optional(v.string()),
});

export const accountInsightsSchema = v.object({
  _id: v.id("accountInsights"),
  _creationTime: v.number(),
  ...baseAccountInsightsSchema.fields,
});

// ============================================================================
// MEDIA INSIGHTS — One row per post per snapshot day
// Powers: top posts, post-level engagement curves, summary cards
// ============================================================================

export const baseMediaInsightsSchema = v.object({
  socialProviderId: v.id("socialProviders"),
  // Delulu post ID if published via us
  postId: v.optional(v.id("posts")),
  // Platform media/video ID
  platformPostId: v.string(),

  userId: v.optional(v.id("users")),
  organizationId: v.optional(v.string()),

  // Denormalized media metadata for display
  // IMAGE, VIDEO, CAROUSEL_ALBUM, SHORT, TWEET, etc.
  mediaType: v.optional(v.string()),
  permalink: v.optional(v.string()),
  caption: v.optional(v.string()),
  postedAt: v.optional(v.number()),
  thumbnailUrl: v.optional(v.string()),

  // Common metrics (normalized — every platform has some version of these)
  // IG: impressions | YT: views | TT: play_count
  views: v.optional(v.number()),
  // IG: reach (unique viewers)
  reach: v.optional(v.number()),
  likes: v.optional(v.number()),
  comments: v.optional(v.number()),
  shares: v.optional(v.number()),
  // IG: saved | YT: added to playlist
  saves: v.optional(v.number()),
  // Total interactions
  engagement: v.optional(v.number()),

  // Platform-specific metrics blob
  // IG: { reelsPlays, reelsAvgWatchTime, reelsVideoViewTotalTime }
  // YT: { estimatedMinutesWatched, averageViewDuration, subscribersGained }
  // TT: { avgWatchTime, fullVideoWatchedRate, totalPlayTime }
  platformMetrics: v.optional(v.any()),

  // Midnight UTC of this snapshot
  snapshotDate: v.number(),
  fetchedAt: v.number(),
  fetchError: v.optional(v.string()),
});

export const mediaInsightsSchema = v.object({
  _id: v.id("mediaInsights"),
  _creationTime: v.number(),
  ...baseMediaInsightsSchema.fields,
});

// ============================================================================
// ANALYTICS SYNC STATE — One row per social provider
// Tracks fetch status, staleness, rate limits
// ============================================================================

export const baseAnalyticsSyncStateSchema = v.object({
  socialProviderId: v.id("socialProviders"),
  lastAccountInsightsFetchedAt: v.optional(v.number()),
  lastMediaInsightsFetchedAt: v.optional(v.number()),
  lastTokenRefreshedAt: v.optional(v.number()),
  syncStatus: analyticsSyncStatusSchema,
  lastSyncError: v.optional(v.string()),
  rateLimitResetAt: v.optional(v.number()),
  updatedAt: v.number(),
});

export const analyticsSyncStateSchema = v.object({
  _id: v.id("analyticsSyncState"),
  _creationTime: v.number(),
  ...baseAnalyticsSyncStateSchema.fields,
});
