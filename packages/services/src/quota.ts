import { QuotaExceededError } from "@delulu/contracts";
import { Subscription } from "@delulu/core";
import {
  getPlanLimits,
  type NumericPlanLimitKey,
} from "@delulu/payments/plans";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { AuthConfig } from "./config";

/** The five hard-capped resources (#159), pooled per `billing_owner_user_id`. */
export type QuotaResource =
  | "socialAccounts"
  | "monthlyPosts"
  | "mediaStorageBytes"
  | "apiRequestsPerMonth"
  | "dmsSent";

const LIMIT_KEY: Record<QuotaResource, NumericPlanLimitKey> = {
  socialAccounts: "socialAccounts",
  monthlyPosts: "monthlyPosts",
  mediaStorageBytes: "mediaStorageBytes",
  apiRequestsPerMonth: "apiRequestsPerMonth",
  dmsSent: "dmsPerMonth",
};

export interface QuotaCheck {
  readonly resource: QuotaResource;
  readonly billingOwnerUserId: string;
  /**
   * Externally-tracked current usage — required for `apiRequestsPerMonth` (KV
   * edge counter) and `socialAccounts` (live COUNT); ignored for resources whose
   * running counter lives on the subscription row.
   */
  readonly currentOverride?: number;
}

/**
 * `QuotaGuard` — block-at-creation policy over the five hard caps. Called by
 * domain services at each creation point (not middleware), in-transaction where
 * it matters (#159). Over the cap → `402 { resource, limit, current, upgradeUrl }`.
 * Never cancels in-flight work.
 *
 * M1 wires `apiRequestsPerMonth` (via `currentOverride` from the worker's KV
 * counter) and exposes `ensure` for the M2 creation points.
 */
export class QuotaGuard extends Context.Service<
  QuotaGuard,
  {
    readonly ensure: (
      check: QuotaCheck
    ) => Effect.Effect<void, QuotaExceededError>;
    readonly reserveMediaStorage: (input: {
      readonly billingOwnerUserId: string;
      readonly delta: number;
    }) => Effect.Effect<void, QuotaExceededError>;
  }
>()("@delulu/services/QuotaGuard") {
  static readonly layer = Layer.effect(
    QuotaGuard,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const config = yield* AuthConfig;

      const findSubscription = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: Subscription,
        execute: (billingOwnerUserId) =>
          sql`SELECT * FROM subscriptions WHERE billing_owner_user_id = ${billingOwnerUserId}`,
      });

      const subscriptionCounter = (
        subscription: Subscription | null,
        resource: QuotaResource
      ): number => {
        if (subscription === null) {
          return 0;
        }
        switch (resource) {
          case "monthlyPosts":
            return Number(subscription.monthlyPosts);
          case "mediaStorageBytes":
            return Number(subscription.mediaStorageBytes);
          case "dmsSent":
            return Number(subscription.dmsSent);
          default:
            return 0;
        }
      };

      const ensure = (check: QuotaCheck) =>
        Effect.gen(function* () {
          const subscription = yield* findSubscription(
            check.billingOwnerUserId
          ).pipe(Effect.map(Option.getOrNull), Effect.orDie);
          const limits = getPlanLimits(subscription?.plan);
          const limit = limits[LIMIT_KEY[check.resource]];
          const current =
            check.currentOverride ??
            subscriptionCounter(subscription, check.resource);

          // -1 = unlimited.
          if (limit === -1 || current < limit) {
            return;
          }
          return yield* Effect.fail(
            new QuotaExceededError({
              message: `Quota exceeded for ${check.resource}`,
              resource: check.resource,
              limit,
              current,
              upgradeUrl: `${config.appBaseUrl}/billing`,
            })
          );
        });

      const reserveMediaStorage = (input: {
        readonly billingOwnerUserId: string;
        readonly delta: number;
      }) =>
        Effect.gen(function* () {
          const rows = yield* sql<{
            plan: string;
            current: string;
          }>`SELECT plan, media_storage_bytes::text AS current
            FROM subscriptions WHERE billing_owner_user_id = ${input.billingOwnerUserId} FOR UPDATE`.pipe(
            Effect.orDie
          );
          const current = Number(rows[0]?.current ?? 0);
          const limit = getPlanLimits(rows[0]?.plan).mediaStorageBytes;
          if (limit !== -1 && current + input.delta > limit) {
            return yield* new QuotaExceededError({
              message: "Quota exceeded for mediaStorageBytes",
              resource: "mediaStorageBytes",
              limit,
              current: current + input.delta,
              upgradeUrl: `${config.appBaseUrl}/billing`,
            });
          }
          yield* sql`UPDATE subscriptions SET media_storage_bytes = media_storage_bytes + ${input.delta}
            WHERE billing_owner_user_id = ${input.billingOwnerUserId}`.pipe(
            Effect.orDie
          );
        });

      return QuotaGuard.of({ ensure, reserveMediaStorage });
    })
  );
}
