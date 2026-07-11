import { DateTime, Schema } from "effect";

export const OperationalCounts = Schema.Struct({
  totalPosts: Schema.Number,
  drafts: Schema.Number,
  pendingReview: Schema.Number,
  scheduled: Schema.Number,
  publishing: Schema.Number,
  published: Schema.Number,
  partiallyFailed: Schema.Number,
  failed: Schema.Number,
  scheduledNextSevenDays: Schema.Number,
  publishedLastThirtyDays: Schema.Number,
});
export type OperationalCounts = typeof OperationalCounts.Type;

export const PublishingStreak = Schema.Struct({
  currentDays: Schema.Number,
  longestDays: Schema.Number,
  lastPublishedDate: Schema.NullOr(Schema.String),
});
export type PublishingStreak = typeof PublishingStreak.Type;

export const WorkspaceOperationalStats = Schema.Struct({
  workspaceId: Schema.String,
  statsVersion: Schema.Number,
  counts: OperationalCounts,
  streak: PublishingStreak,
  generatedAt: Schema.String,
});
export type WorkspaceOperationalStats = typeof WorkspaceOperationalStats.Type;

export const InsightTotals = Schema.Struct({
  impressions: Schema.Number,
  reach: Schema.Number,
  engagements: Schema.Number,
  followersGained: Schema.Number,
  profileViews: Schema.Number,
});
export type InsightTotals = typeof InsightTotals.Type;

export const InsightPeriod = Schema.Struct({
  since: Schema.String,
  until: Schema.String,
  totals: InsightTotals,
  points: Schema.Array(
    Schema.Struct({
      date: Schema.String,
      impressions: Schema.Number,
      reach: Schema.Number,
      engagements: Schema.Number,
      followersGained: Schema.Number,
      profileViews: Schema.Number,
    })
  ),
});
export type InsightPeriod = typeof InsightPeriod.Type;

export const InsightMedia = Schema.Struct({
  id: Schema.String,
  caption: Schema.NullOr(Schema.String),
  mediaType: Schema.String,
  permalink: Schema.NullOr(Schema.String),
  publishedAt: Schema.String,
  impressions: Schema.Number,
  reach: Schema.Number,
  engagements: Schema.Number,
});
export type InsightMedia = typeof InsightMedia.Type;

export const LiveInsights = Schema.Struct({
  current: InsightPeriod,
  previous: InsightPeriod,
  percentageChange: InsightTotals,
  topPosts: Schema.Array(InsightMedia),
  stale: Schema.Boolean,
  cachedAt: Schema.String,
});
export type LiveInsights = typeof LiveInsights.Type;

export class AnalyticsProviderError extends Schema.TaggedErrorClass<AnalyticsProviderError>()(
  "AnalyticsProviderError",
  { message: Schema.String, retryable: Schema.Boolean }
) {}

export class AnalyticsCacheError extends Schema.TaggedErrorClass<AnalyticsCacheError>()(
  "AnalyticsCacheError",
  { message: Schema.String, retryable: Schema.Boolean }
) {}

const dayNumber = (value: DateTime.DateTime): number => {
  return Math.floor(
    DateTime.toEpochMillis(DateTime.startOf(value, "day")) / 86_400_000
  );
};

/** Derive the team's UTC publishing streak from distinct publication days. */
export const calculatePublishingStreak = (
  publishedAt: readonly DateTime.DateTime[],
  now: DateTime.DateTime
): PublishingStreak => {
  const days = [...new Set(publishedAt.map(dayNumber))].sort((a, b) => b - a);
  if (days.length === 0) {
    return { currentDays: 0, longestDays: 0, lastPublishedDate: null };
  }

  let longest = 1;
  let run = 1;
  for (let index = 1; index < days.length; index++) {
    if (days[index - 1]! - days[index]! === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = dayNumber(now);
  const currentStartsNow = days[0] === today || days[0] === today - 1;
  let current = currentStartsNow ? 1 : 0;
  if (currentStartsNow) {
    for (let index = 1; index < days.length; index++) {
      if (days[index - 1]! - days[index]! !== 1) {
        break;
      }
      current += 1;
    }
  }

  return {
    currentDays: current,
    longestDays: longest,
    lastPublishedDate: DateTime.formatIsoDateUtc(
      publishedAt.reduce((latest, value) =>
        DateTime.toEpochMillis(value) > DateTime.toEpochMillis(latest)
          ? value
          : latest
      )
    ),
  };
};

export const percentageChange = (current: number, previous: number): number =>
  previous === 0
    ? current === 0
      ? 0
      : 100
    : ((current - previous) / previous) * 100;

export const compareInsightTotals = (
  current: InsightTotals,
  previous: InsightTotals
): InsightTotals => ({
  impressions: percentageChange(current.impressions, previous.impressions),
  reach: percentageChange(current.reach, previous.reach),
  engagements: percentageChange(current.engagements, previous.engagements),
  followersGained: percentageChange(
    current.followersGained,
    previous.followersGained
  ),
  profileViews: percentageChange(current.profileViews, previous.profileViews),
});
