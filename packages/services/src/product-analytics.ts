import type { AuthContext } from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import type { WorkspaceAccess } from "./workspace-access";

/**
 * Per-deployment PostHog configuration, provided by the worker from its
 * env/secrets. Kept as a service (not read from `process.env`) so it composes
 * per-request and stays testable — mirrors {@link AuthConfig}.
 *
 * `enabled` is `false` when no key is configured, which turns the whole service
 * into a no-op (events are never buffered and the flush never fires). This lets
 * us ship the plumbing dark and light it up by setting `POSTHOG_KEY`.
 */
export class PostHogConfig extends Context.Service<
  PostHogConfig,
  {
    /** PostHog project API key (`phc_...`). Empty ⇒ analytics disabled. */
    readonly apiKey: string;
    /** PostHog ingestion host, e.g. `https://us.i.posthog.com`. */
    readonly host: string;
    /** Deployment environment tag stamped on every event. */
    readonly environment: string;
    /** Whether capture is active. Derived from a non-empty `apiKey`. */
    readonly enabled: boolean;
  }
>()("@delulu/services/PostHogConfig") {}

export interface CaptureInput {
  readonly distinctId: string;
  readonly event: string;
  readonly properties?: Record<string, unknown>;
  /** PostHog group associations, e.g. `{ workspace: workspaceId }`. */
  readonly groups?: Record<string, string>;
}

export interface IdentifyInput {
  readonly distinctId: string;
  /** Person properties to overwrite (latest-touch). */
  readonly set?: Record<string, unknown>;
  /** Person properties set only if not already present (first-touch). */
  readonly setOnce?: Record<string, unknown>;
}

export interface GroupIdentifyInput {
  /** Group type, e.g. `"workspace"`. */
  readonly type: string;
  /** Group key (the concrete group id). */
  readonly key: string;
  /** Group properties to set. */
  readonly set?: Record<string, unknown>;
}

export interface AliasInput {
  /** The canonical person id server events use (our internal user id). */
  readonly distinctId: string;
  /** The other id to merge into the person (e.g. the Clerk user id used by web/CLI). */
  readonly alias: string;
}

interface BatchEvent {
  readonly event: string;
  readonly distinct_id: string;
  readonly timestamp: string;
  readonly properties: Record<string, unknown>;
}

const LIB = "delulu-api";

/** Trailing slashes on the configured host, stripped before appending `/batch/`. */
const TRAILING_SLASHES = /\/+$/;

/**
 * Server-side product analytics (PostHog) for the Cloudflare Worker API.
 *
 * Reliability model (workerd):
 * - We deliberately do NOT use `posthog-node`. Its internal queue flushes from a
 *   timer/microtask it owns, which workerd cancels the instant the response is
 *   returned → silent event loss (the same class of failure as reusing a pg
 *   socket across requests). Instead we buffer events in a per-request closure
 *   and flush them ourselves with a single `fetch` to PostHog's `/batch/`.
 * - The flush is registered as a scope finalizer. `Layer.effect` runs its build
 *   effect in the layer's scope, so this finalizer fires when the per-request
 *   base layer is disposed. In `apps/api/src/index.ts` that dispose already runs
 *   inside `ctx.waitUntil(...)` for both the fetch and scheduled handlers, so the
 *   outbound flush stays alive past the response — the exact lifecycle the pg
 *   pool teardown already relies on.
 * - The buffer lives in a fresh layer per request (no cross-request client
 *   memoization), so there is no shared-socket hazard.
 * - Telemetry can never fail business logic: every method returns
 *   `Effect<void>` (no error channel) and the flush swallows+logs failures.
 */
export class ProductAnalytics extends Context.Service<
  ProductAnalytics,
  {
    readonly capture: (input: CaptureInput) => Effect.Effect<void>;
    readonly identify: (input: IdentifyInput) => Effect.Effect<void>;
    readonly groupIdentify: (input: GroupIdentifyInput) => Effect.Effect<void>;
    readonly alias: (input: AliasInput) => Effect.Effect<void>;
  }
>()("@delulu/services/ProductAnalytics") {
  static readonly layer = Layer.effect(
    ProductAnalytics,
    Effect.gen(function* () {
      const config = yield* PostHogConfig;
      const host = config.host.replace(TRAILING_SLASHES, "");

      // Per-request buffer. This layer is rebuilt per request by makeBaseLayer,
      // so a closure-local array is inherently request-scoped.
      const buffer: BatchEvent[] = [];

      const enqueue = (payload: BatchEvent) =>
        Effect.sync(() => {
          if (config.enabled) {
            buffer.push(payload);
          }
        });

      const flush = Effect.suspend(() => {
        if (!(config.enabled && buffer.length > 0)) {
          return Effect.void;
        }
        const batch = buffer.splice(0, buffer.length);
        return Effect.tryPromise(() =>
          fetch(`${host}/batch/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ api_key: config.apiKey, batch }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`PostHog /batch responded ${response.status}`);
            }
          })
        ).pipe(
          // Telemetry must never fail request/scope teardown. Log and swallow.
          Effect.catchCause((cause) =>
            Effect.logWarning("PostHog flush failed", cause)
          )
        );
      });

      // Flush buffered events when the layer scope closes (request/cron dispose),
      // which is tracked by ctx.waitUntil upstream — see class doc.
      yield* Effect.addFinalizer(() => flush);

      const now = () => new Date().toISOString();

      const baseProperties = (extra?: Record<string, unknown>) => ({
        $lib: LIB,
        environment: config.environment,
        ...extra,
      });

      const capture: ProductAnalytics["Service"]["capture"] = (input) =>
        enqueue({
          event: input.event,
          distinct_id: input.distinctId,
          timestamp: now(),
          properties: baseProperties({
            ...input.properties,
            ...(input.groups ? { $groups: input.groups } : {}),
          }),
        });

      const identify: ProductAnalytics["Service"]["identify"] = (input) =>
        enqueue({
          event: "$identify",
          distinct_id: input.distinctId,
          timestamp: now(),
          properties: baseProperties({
            ...(input.set ? { $set: input.set } : {}),
            ...(input.setOnce ? { $set_once: input.setOnce } : {}),
          }),
        });

      const groupIdentify: ProductAnalytics["Service"]["groupIdentify"] = (
        input
      ) =>
        enqueue({
          event: "$groupidentify",
          // Server-side group identify convention: distinct_id ties the event
          // to the group itself, not a person.
          distinct_id: `$${input.type}_${input.key}`,
          timestamp: now(),
          properties: baseProperties({
            $group_type: input.type,
            $group_key: input.key,
            $group_set: input.set ?? {},
          }),
        });

      const alias: ProductAnalytics["Service"]["alias"] = (input) =>
        enqueue({
          event: "$create_alias",
          distinct_id: input.distinctId,
          timestamp: now(),
          properties: baseProperties({ alias: input.alias }),
        });

      return ProductAnalytics.of({ capture, identify, groupIdentify, alias });
    })
  );
}

/**
 * Build a workspace-scoped {@link CaptureInput} with the standard server
 * super-properties. `distinctId` is our internal user id (the canonical
 * server-side person key; web/CLI's Clerk id is merged into it via a
 * `$create_alias` emitted at signup). `environment` is added by the service.
 */
export const workspaceEvent = (args: {
  readonly auth: AuthContext;
  readonly access: WorkspaceAccess;
  readonly event: string;
  readonly properties?: Record<string, unknown>;
}): CaptureInput => ({
  distinctId: args.auth.userId,
  event: args.event,
  groups: { workspace: args.access.workspaceId },
  properties: {
    platform: "api",
    workspace_id: args.access.workspaceId,
    role: args.access.role,
    is_personal: args.access.isPersonal,
    credential: args.auth.credential,
    ...args.properties,
  },
});
