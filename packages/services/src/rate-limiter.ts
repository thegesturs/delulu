import { RateLimitedError } from "@delulu/contracts";
import { Context, Effect, Layer } from "effect";

/**
 * Tier for a request: API-key traffic is limited by the plan's
 * `apiRatePerMinute`; interactive session traffic gets the flat
 * `SESSION_RATE_PER_MINUTE` safety net (#159).
 */
export type RateTier =
  | { readonly kind: "api"; readonly perMinute: number }
  | { readonly kind: "session" };

/** The shape of a Cloudflare native Rate Limiting binding. */
export interface CfRateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** One binding per distinct static limit (bindings carry a fixed limit each). */
export interface RateLimitBindings {
  readonly api20: CfRateLimiter;
  readonly api60: CfRateLimiter;
  readonly api120: CfRateLimiter;
  readonly session300: CfRateLimiter;
}

const RETRY_AFTER_SECONDS = 60;

/**
 * Per-credential rate limiting (#159). Keyed by `apiKeyId` (API) or `userId`
 * (session) — deliberately unpooled so one runaway credential cannot starve its
 * siblings. Over limit → `429` with `Retry-After`.
 */
export class RateLimiterService extends Context.Service<
  RateLimiterService,
  {
    readonly limit: (
      key: string,
      tier: RateTier
    ) => Effect.Effect<void, RateLimitedError>;
  }
>()("@delulu/services/RateLimiterService") {
  /**
   * Cloudflare-backed implementation. Selects the static binding matching the
   * tier's per-minute limit; unknown API limits fall back to the tightest (20).
   */
  static readonly workersLayer = (bindings: RateLimitBindings) =>
    Layer.succeed(
      RateLimiterService,
      RateLimiterService.of({
        limit: (key, tier) => {
          const binding = RateLimiterService.selectBinding(bindings, tier);
          return Effect.tryPromise({
            try: () => binding.limit({ key }),
            catch: () =>
              new RateLimitedError({
                message: "Rate limiter unavailable",
                retryAfter: RETRY_AFTER_SECONDS,
              }),
          }).pipe(
            Effect.flatMap((result) =>
              result.success
                ? Effect.void
                : Effect.fail(
                    new RateLimitedError({
                      message: "Rate limit exceeded",
                      retryAfter: RETRY_AFTER_SECONDS,
                    })
                  )
            )
          );
        },
      })
    );

  /** In-memory fixed-window limiter for tests and local dev (no CF binding). */
  static readonly inMemoryLayer = (options?: {
    readonly nowMillis?: () => number;
    readonly sessionPerMinute?: number;
  }) =>
    Layer.sync(RateLimiterService, () => {
      const now = options?.nowMillis ?? (() => Date.now());
      const sessionLimit = options?.sessionPerMinute ?? 300;
      const windows = new Map<string, { window: number; count: number }>();
      return RateLimiterService.of({
        limit: (key, tier) =>
          Effect.suspend(() => {
            const perMinute =
              tier.kind === "api" ? tier.perMinute : sessionLimit;
            const window = Math.floor(now() / 60_000);
            const bucketKey = `${key}:${window}`;
            const entry = windows.get(bucketKey) ?? { window, count: 0 };
            entry.count += 1;
            windows.set(bucketKey, entry);
            return entry.count > perMinute
              ? Effect.fail(
                  new RateLimitedError({
                    message: "Rate limit exceeded",
                    retryAfter: RETRY_AFTER_SECONDS,
                  })
                )
              : Effect.void;
          }),
      });
    });

  private static selectBinding(
    bindings: RateLimitBindings,
    tier: RateTier
  ): CfRateLimiter {
    if (tier.kind === "session") {
      return bindings.session300;
    }
    switch (tier.perMinute) {
      case 120:
        return bindings.api120;
      case 60:
        return bindings.api60;
      default:
        return bindings.api20;
    }
  }
}
