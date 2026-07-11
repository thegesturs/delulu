import { NotFoundError } from "@delulu/contracts";
import {
  type AnalyticsProviderError,
  calculatePublishingStreak,
  compareInsightTotals,
  InsightMedia,
  InsightPeriod,
  type LiveInsights,
  WorkspaceOperationalStats,
} from "@delulu/core/domain/analytics";
import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import {
  AnalyticsCache,
  insightPeriodCacheKey,
  operationalStatsCacheKey,
  operationalStatsVersionKey,
  recentMediaCacheKey,
} from "./analytics-cache";

const EDGE_STATS_TTL_SECONDS = 30;
const INSIGHTS_FRESH_SECONDS = 60 * 60;
const INSIGHTS_STALE_RETENTION_SECONDS = 24 * 60 * 60;

const CachedStats = Schema.Struct({ value: WorkspaceOperationalStats });
const CachedInsightPeriod = Schema.Struct({
  value: InsightPeriod,
  cachedAt: Schema.String,
});
const CachedRecentMedia = Schema.Struct({
  value: Schema.Array(InsightMedia),
  cachedAt: Schema.String,
});

const decodeJson = <A, I>(
  schema: Schema.Codec<A, I>,
  raw: string
): A | null => {
  const result = Schema.decodeUnknownOption(Schema.fromJsonString(schema))(raw);
  return Option.getOrNull(result);
};

export interface InsightPeriodRequest {
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly since: string;
  readonly until: string;
}

/** Provider adapter implemented by the Node-bound platform insights runtime. */
export class LiveInsightsProvider extends Context.Service<
  LiveInsightsProvider,
  {
    readonly fetchPeriod: (
      request: InsightPeriodRequest
    ) => Effect.Effect<InsightPeriod, AnalyticsProviderError>;
    readonly fetchRecentMedia: (request: {
      readonly workspaceId: string;
      readonly connectionId: string;
      readonly limit: number;
    }) => Effect.Effect<readonly InsightMedia[], AnalyticsProviderError>;
  }
>()("@delulu/services/LiveInsightsProvider") {}

const StatsRow = Schema.Struct({
  statsVersion: Schema.NumberFromString,
  totalPosts: Schema.NumberFromString,
  drafts: Schema.NumberFromString,
  pendingReview: Schema.NumberFromString,
  scheduled: Schema.NumberFromString,
  publishing: Schema.NumberFromString,
  published: Schema.NumberFromString,
  partiallyFailed: Schema.NumberFromString,
  failed: Schema.NumberFromString,
  scheduledNextSevenDays: Schema.NumberFromString,
  publishedLastThirtyDays: Schema.NumberFromString,
  publishedDates: Schema.Array(Schema.String),
});

export class AnalyticsService extends Context.Service<
  AnalyticsService,
  {
    readonly operational: (
      workspaceId: string
    ) => Effect.Effect<WorkspaceOperationalStats, NotFoundError>;
    readonly insights: (input: {
      readonly workspaceId: string;
      readonly connectionId: string;
      readonly windowDays: number;
    }) => Effect.Effect<LiveInsights, NotFoundError | AnalyticsProviderError>;
    readonly invalidate: (workspaceId: string) => Effect.Effect<number>;
  }
>()("@delulu/services/AnalyticsService") {
  static readonly layer = Layer.effect(
    AnalyticsService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const cache = yield* AnalyticsCache;
      const provider = yield* LiveInsightsProvider;

      const findStats = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: StatsRow,
        execute: (workspaceId) => sql`
          SELECT w.stats_version::text AS stats_version,
            count(p.id)::text AS total_posts,
            count(*) FILTER (WHERE p.status = 'draft')::text AS drafts,
            count(*) FILTER (WHERE p.status = 'pending_review')::text AS pending_review,
            count(*) FILTER (WHERE p.status = 'scheduled')::text AS scheduled,
            count(*) FILTER (WHERE p.status = 'publishing')::text AS publishing,
            count(*) FILTER (WHERE p.status = 'published')::text AS published,
            count(*) FILTER (WHERE p.status = 'partially_failed')::text AS partially_failed,
            count(*) FILTER (WHERE p.status = 'failed')::text AS failed,
            count(*) FILTER (WHERE p.status = 'scheduled' AND EXISTS (
              SELECT 1 FROM post_targets pt WHERE pt.post_id = p.id
                AND pt.scheduled_at >= now() AND pt.scheduled_at < now() + interval '7 days'
            ))::text AS scheduled_next_seven_days,
            count(*) FILTER (WHERE p.published_at >= now() - interval '30 days')::text AS published_last_thirty_days
            , COALESCE(json_agg(DISTINCT to_char(p.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'))
                FILTER (WHERE p.published_at IS NOT NULL), '[]'::json) AS published_dates
          FROM workspaces w LEFT JOIN posts p ON p.workspace_id = w.id AND p.deleted_at IS NULL
          WHERE w.id = ${workspaceId} AND w.deleted_at IS NULL
          GROUP BY w.id, w.stats_version`,
      });

      const operational = Effect.fn("AnalyticsService.operational")(function* (
        workspaceId: string
      ) {
        const versionKey = operationalStatsVersionKey(workspaceId);
        const cachedVersionRaw = yield* cache
          .get(versionKey)
          .pipe(Effect.orElseSucceed(() => null));
        if (cachedVersionRaw) {
          const cachedVersion = Schema.decodeUnknownOption(
            Schema.fromJsonString(Schema.Number)
          )(cachedVersionRaw);
          if (Option.isSome(cachedVersion)) {
            const cachedRaw = yield* cache
              .get(operationalStatsCacheKey(workspaceId, cachedVersion.value))
              .pipe(Effect.orElseSucceed(() => null));
            if (cachedRaw) {
              const cached = decodeJson(CachedStats, cachedRaw);
              if (cached) {
                return cached.value;
              }
            }
          }
        }
        const row = yield* findStats(workspaceId).pipe(Effect.orDie);
        if (Option.isNone(row)) {
          return yield* new NotFoundError({
            message: "Workspace not found",
            resource: "workspace",
          });
        }
        const now = yield* DateTime.now;
        const value: WorkspaceOperationalStats = {
          workspaceId,
          statsVersion: row.value.statsVersion,
          counts: {
            totalPosts: row.value.totalPosts,
            drafts: row.value.drafts,
            pendingReview: row.value.pendingReview,
            scheduled: row.value.scheduled,
            publishing: row.value.publishing,
            published: row.value.published,
            partiallyFailed: row.value.partiallyFailed,
            failed: row.value.failed,
            scheduledNextSevenDays: row.value.scheduledNextSevenDays,
            publishedLastThirtyDays: row.value.publishedLastThirtyDays,
          },
          streak: calculatePublishingStreak(
            row.value.publishedDates.map((date) => DateTime.makeUnsafe(date)),
            now
          ),
          generatedAt: DateTime.formatIso(now),
        };
        yield* cache
          .put(
            operationalStatsCacheKey(workspaceId, row.value.statsVersion),
            JSON.stringify({ value }),
            EDGE_STATS_TTL_SECONDS
          )
          .pipe(Effect.ignore);
        yield* cache
          .put(
            versionKey,
            JSON.stringify(row.value.statsVersion),
            EDGE_STATS_TTL_SECONDS
          )
          .pipe(Effect.ignore);
        return value;
      });

      const loadPeriod = Effect.fn("AnalyticsService.loadPeriod")(function* (
        request: InsightPeriodRequest
      ) {
        const key = insightPeriodCacheKey(request);
        const cachedRaw = yield* cache
          .get(key)
          .pipe(Effect.orElseSucceed(() => null));
        const cached = cachedRaw
          ? decodeJson(CachedInsightPeriod, cachedRaw)
          : null;
        const now = yield* DateTime.now;
        const cachedAt = cached
          ? Option.getOrNull(DateTime.make(cached.cachedAt))
          : null;
        const fresh =
          cached !== null &&
          cachedAt !== null &&
          DateTime.toEpochMillis(now) - DateTime.toEpochMillis(cachedAt) <
            INSIGHTS_FRESH_SECONDS * 1000;
        if (fresh) {
          return { ...cached, stale: false };
        }

        const fetched = yield* provider
          .fetchPeriod(request)
          .pipe(Effect.result);
        if (fetched._tag === "Success") {
          const next = {
            value: fetched.success,
            cachedAt: DateTime.formatIso(now),
          };
          yield* cache
            .put(key, JSON.stringify(next), INSIGHTS_STALE_RETENTION_SECONDS)
            .pipe(Effect.ignore);
          return { ...next, stale: false };
        }
        if (cached) {
          return { ...cached, stale: true };
        }
        return yield* fetched.failure;
      });

      const loadRecentMedia = Effect.fn("AnalyticsService.loadRecentMedia")(
        function* (request: {
          readonly workspaceId: string;
          readonly connectionId: string;
        }) {
          const key = recentMediaCacheKey(request);
          const cachedRaw = yield* cache
            .get(key)
            .pipe(Effect.orElseSucceed(() => null));
          const cached = cachedRaw
            ? decodeJson(CachedRecentMedia, cachedRaw)
            : null;
          const now = yield* DateTime.now;
          const cachedAt = cached
            ? Option.getOrNull(DateTime.make(cached.cachedAt))
            : null;
          if (
            cached !== null &&
            cachedAt !== null &&
            DateTime.toEpochMillis(now) - DateTime.toEpochMillis(cachedAt) <
              INSIGHTS_FRESH_SECONDS * 1000
          ) {
            return { ...cached, stale: false };
          }
          const fetched = yield* provider
            .fetchRecentMedia({ ...request, limit: 50 })
            .pipe(Effect.result);
          if (fetched._tag === "Success") {
            const next = {
              value: [...fetched.success]
                .sort((left, right) => right.engagements - left.engagements)
                .slice(0, 10),
              cachedAt: DateTime.formatIso(now),
            };
            yield* cache
              .put(key, JSON.stringify(next), INSIGHTS_STALE_RETENTION_SECONDS)
              .pipe(Effect.ignore);
            return { ...next, stale: false };
          }
          if (cached) {
            return { ...cached, stale: true };
          }
          return yield* fetched.failure;
        }
      );

      const insights = Effect.fn("AnalyticsService.insights")(
        function* (input: {
          readonly workspaceId: string;
          readonly connectionId: string;
          readonly windowDays: number;
        }) {
          const owned = yield* sql<{ exists: boolean }>`SELECT EXISTS(
          SELECT 1 FROM connections WHERE id = ${input.connectionId}
            AND workspace_id = ${input.workspaceId}
        ) AS exists`.pipe(Effect.orDie);
          if (!owned[0]?.exists) {
            return yield* new NotFoundError({
              message: "Connection not found",
              resource: "connection",
            });
          }
          const now = yield* DateTime.now;
          const until = DateTime.formatIsoDateUtc(now);
          const sinceDate = DateTime.subtract(now, { days: input.windowDays });
          const since = DateTime.formatIsoDateUtc(sinceDate);
          const previousSince = DateTime.formatIsoDateUtc(
            DateTime.subtract(sinceDate, { days: input.windowDays })
          );
          const current = yield* loadPeriod({ ...input, since, until });
          const previous = yield* loadPeriod({
            ...input,
            since: previousSince,
            until: since,
          });
          const recentMedia = yield* loadRecentMedia(input);
          return {
            current: current.value,
            previous: previous.value,
            percentageChange: compareInsightTotals(
              current.value.totals,
              previous.value.totals
            ),
            topPosts: recentMedia.value,
            stale: current.stale || previous.stale || recentMedia.stale,
            cachedAt: [
              current.cachedAt,
              previous.cachedAt,
              recentMedia.cachedAt,
            ].sort()[0]!,
          };
        }
      );

      const invalidate = Effect.fn("AnalyticsService.invalidate")(function* (
        workspaceId: string
      ) {
        const rows = yield* sql<{ statsVersion: string }>`
            UPDATE workspaces SET stats_version = stats_version + 1
            WHERE id = ${workspaceId} RETURNING stats_version::text AS stats_version`.pipe(
          Effect.orDie
        );
        const version = Number(rows[0]?.statsVersion ?? 0);
        yield* cache
          .put(
            operationalStatsVersionKey(workspaceId),
            JSON.stringify(version),
            EDGE_STATS_TTL_SECONDS
          )
          .pipe(Effect.ignore);
        return version;
      });

      return AnalyticsService.of({ operational, insights, invalidate });
    })
  );
}
