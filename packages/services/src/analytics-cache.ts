import { AnalyticsCacheError } from "@delulu/core/domain/analytics";
import { Context, Effect, Layer } from "effect";

export interface KeyValueCacheBinding {
  readonly get: (key: string) => Promise<string | null>;
  readonly put: (
    key: string,
    value: string,
    options?: { readonly expirationTtl?: number }
  ) => Promise<void>;
  readonly delete?: (key: string) => Promise<void>;
}

/** Injectable edge/KV cache shared by short-lived stats and insights caches. */
export class AnalyticsCache extends Context.Service<
  AnalyticsCache,
  {
    readonly get: (
      key: string
    ) => Effect.Effect<string | null, AnalyticsCacheError>;
    readonly put: (
      key: string,
      value: string,
      ttlSeconds: number
    ) => Effect.Effect<void, AnalyticsCacheError>;
    readonly remove: (key: string) => Effect.Effect<void, AnalyticsCacheError>;
  }
>()("@delulu/services/AnalyticsCache") {}

export const makeAnalyticsCacheLayer = (binding: KeyValueCacheBinding) =>
  Layer.succeed(
    AnalyticsCache,
    AnalyticsCache.of({
      get: Effect.fn("AnalyticsCache.get")(function* (key: string) {
        return yield* Effect.tryPromise({
          try: () => binding.get(key),
          catch: (cause) =>
            new AnalyticsCacheError({
              message: `Unable to read analytics cache: ${String(cause)}`,
              retryable: true,
            }),
        });
      }),
      put: Effect.fn("AnalyticsCache.put")(function* (
        key: string,
        value: string,
        ttlSeconds: number
      ) {
        yield* Effect.tryPromise({
          try: () => binding.put(key, value, { expirationTtl: ttlSeconds }),
          catch: (cause) =>
            new AnalyticsCacheError({
              message: `Unable to write analytics cache: ${String(cause)}`,
              retryable: true,
            }),
        });
      }),
      remove: Effect.fn("AnalyticsCache.remove")(function* (key: string) {
        if (binding.delete) {
          yield* Effect.tryPromise({
            try: () => binding.delete!(key),
            catch: (cause) =>
              new AnalyticsCacheError({
                message: `Unable to remove analytics cache: ${String(cause)}`,
                retryable: true,
              }),
          });
        }
      }),
    })
  );

export const makeMemoryAnalyticsCacheLayer = () => {
  const values = new Map<string, string>();
  return makeAnalyticsCacheLayer({
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => {
      values.set(key, value);
    },
    delete: async (key) => {
      values.delete(key);
    },
  });
};

export const operationalStatsCacheKey = (
  workspaceId: string,
  statsVersion: number
): string => `analytics:operational:${workspaceId}:v${statsVersion}`;

export const operationalStatsVersionKey = (workspaceId: string): string =>
  `analytics:operational:${workspaceId}:current-version`;

export const insightPeriodCacheKey = (input: {
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly since: string;
  readonly until: string;
}): string =>
  `analytics:insights:${input.workspaceId}:${input.connectionId}:${input.since}:${input.until}`;

export const recentMediaCacheKey = (input: {
  readonly workspaceId: string;
  readonly connectionId: string;
}): string =>
  `analytics:insights:${input.workspaceId}:${input.connectionId}:recent-media`;
