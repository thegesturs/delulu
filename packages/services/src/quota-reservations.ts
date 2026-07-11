import { QuotaExceededError } from "@delulu/contracts";
import {
  BillingConcurrencyError,
  BillingStateError,
  type PooledQuotaResource,
} from "@delulu/core/domain/billing";
import { getPlanLimits } from "@delulu/payments/plans";
import { Context, DateTime, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { AuthConfig } from "./config";

const limitFor = (plan: string, resource: PooledQuotaResource): number => {
  const limits = getPlanLimits(plan);
  switch (resource) {
    case "socialAccounts":
      return limits.socialAccounts;
    case "monthlyPosts":
      return limits.monthlyPosts;
    case "mediaStorageBytes":
      return limits.mediaStorageBytes;
    case "apiRequestsPerMonth":
      return limits.apiRequestsPerMonth;
    case "dmsSent":
      return limits.dmsPerMonth;
    case "transcriptionsUsed":
      return -1;
    default:
      return -1;
  }
};

const currentFor = (
  row: Record<string, unknown>,
  resource: PooledQuotaResource
): number => {
  const column: Record<PooledQuotaResource, string> = {
    socialAccounts: "socialAccounts",
    monthlyPosts: "monthlyPosts",
    mediaStorageBytes: "mediaStorageBytes",
    apiRequestsPerMonth: "apiRequestsPerMonth",
    dmsSent: "dmsSent",
    transcriptionsUsed: "transcriptionsUsed",
  };
  return Number(row[column[resource]] ?? 0);
};

export interface QuotaReservation {
  readonly id: string;
  readonly resource: PooledQuotaResource;
  readonly amount: number;
  readonly status: "pending" | "committed" | "released" | "expired";
  readonly expiresAt: string;
}

export class PooledQuotaReservations extends Context.Service<
  PooledQuotaReservations,
  {
    readonly reserve: (input: {
      readonly id: string;
      readonly workspaceId: string;
      readonly billingOwnerUserId: string;
      readonly resource: PooledQuotaResource;
      readonly amount: number;
      readonly idempotencyKey: string;
      readonly ttlSeconds?: number;
    }) => Effect.Effect<
      QuotaReservation,
      QuotaExceededError | BillingStateError
    >;
    readonly commit: (
      id: string
    ) => Effect.Effect<void, BillingStateError | BillingConcurrencyError>;
    readonly release: (id: string) => Effect.Effect<void, BillingStateError>;
    readonly expire: () => Effect.Effect<number>;
  }
>()("@delulu/services/PooledQuotaReservations") {
  static readonly layer = Layer.effect(
    PooledQuotaReservations,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const config = yield* AuthConfig;

      const reserve = Effect.fn("PooledQuotaReservations.reserve")(
        function* (input: {
          readonly id: string;
          readonly workspaceId: string;
          readonly billingOwnerUserId: string;
          readonly resource: PooledQuotaResource;
          readonly amount: number;
          readonly idempotencyKey: string;
          readonly ttlSeconds?: number;
        }) {
          if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
            return yield* new BillingStateError({
              message: "Reservation amount must be a positive safe integer",
              reason: "invalid_amount",
              retryable: false,
            });
          }
          const now = yield* DateTime.now;
          const expiresAt = DateTime.add(now, {
            seconds: input.ttlSeconds ?? 300,
          });
          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                const existing = yield* sql<Record<string, unknown>>`
                SELECT id, resource, amount, status, expires_at
                FROM quota_reservations WHERE idempotency_key = ${input.idempotencyKey}`;
                if (existing[0]) {
                  return {
                    id: String(existing[0].id),
                    resource: existing[0].resource as PooledQuotaResource,
                    amount: Number(existing[0].amount),
                    status: existing[0].status as QuotaReservation["status"],
                    expiresAt: DateTime.formatIso(
                      DateTime.fromDateUnsafe(existing[0].expiresAt as Date)
                    ),
                  };
                }
                const subscriptions = yield* sql<Record<string, unknown>>`
                SELECT plan, social_accounts, monthly_posts, media_storage_bytes,
                  api_requests_per_month, dms_sent, dms_sent_period_start,
                  transcriptions_used
                FROM subscriptions WHERE billing_owner_user_id = ${input.billingOwnerUserId}
                FOR UPDATE`;
                const subscription = subscriptions[0];
                if (!subscription) {
                  return yield* new BillingStateError({
                    message: "Billing owner has no subscription",
                    reason: "subscription_missing",
                    retryable: false,
                  });
                }
                const concurrentlyCreated = yield* sql<
                  Record<string, unknown>
                >`SELECT id, resource, amount, status, expires_at
                  FROM quota_reservations WHERE idempotency_key = ${input.idempotencyKey}`;
                if (concurrentlyCreated[0]) {
                  return {
                    id: String(concurrentlyCreated[0].id),
                    resource: concurrentlyCreated[0]
                      .resource as PooledQuotaResource,
                    amount: Number(concurrentlyCreated[0].amount),
                    status: concurrentlyCreated[0]
                      .status as QuotaReservation["status"],
                    expiresAt: DateTime.formatIso(
                      DateTime.fromDateUnsafe(
                        concurrentlyCreated[0].expiresAt as Date
                      )
                    ),
                  };
                }
                if (input.resource === "dmsSent") {
                  const reset = yield* sql<{
                    dmsSent: string;
                  }>`UPDATE subscriptions
                  SET dms_sent = 0, dms_sent_period_start = now()
                  WHERE billing_owner_user_id = ${input.billingOwnerUserId}
                    AND (dms_sent_period_start IS NULL
                      OR dms_sent_period_start < now() - interval '1 month')
                  RETURNING dms_sent::text AS dms_sent`;
                  if (reset[0]) {
                    subscription.dmsSent = 0;
                  }
                }
                yield* sql`UPDATE quota_reservations SET status = 'expired'
                WHERE billing_owner_user_id = ${input.billingOwnerUserId}
                  AND resource = ${input.resource} AND status = 'pending'
                  AND expires_at <= now()`;
                const pendingRows = yield* sql<{ amount: string }>`
                SELECT COALESCE(sum(amount), 0)::text AS amount
                FROM quota_reservations
                WHERE billing_owner_user_id = ${input.billingOwnerUserId}
                  AND resource = ${input.resource} AND status = 'pending'
                  AND expires_at > now()`;
                const current = currentFor(subscription, input.resource);
                const pending = Number(pendingRows[0]?.amount ?? 0);
                const requested = current + pending + input.amount;
                const limit = limitFor(
                  String(subscription.plan),
                  input.resource
                );
                if (limit !== -1 && requested > limit) {
                  return yield* new QuotaExceededError({
                    message: `Quota exceeded for ${input.resource}`,
                    resource: input.resource,
                    limit,
                    current: requested,
                    upgradeUrl: `${config.appBaseUrl}/billing`,
                  });
                }
                yield* sql`INSERT INTO quota_reservations
                (id, billing_owner_user_id, workspace_id, resource, amount,
                  idempotency_key, expires_at)
                VALUES (${input.id}, ${input.billingOwnerUserId}, ${input.workspaceId},
                  ${input.resource}, ${input.amount}, ${input.idempotencyKey},
                  ${DateTime.toDateUtc(expiresAt)})`;
                return {
                  id: input.id,
                  resource: input.resource,
                  amount: input.amount,
                  status: "pending" as const,
                  expiresAt: DateTime.formatIso(expiresAt),
                };
              })
            )
            .pipe(Effect.catchTag("SqlError", Effect.die));
        }
      );

      const commit = Effect.fn("PooledQuotaReservations.commit")(function* (
        id: string
      ) {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              const rows = yield* sql<Record<string, unknown>>`
                SELECT * FROM quota_reservations WHERE id = ${id} FOR UPDATE`;
              const reservation = rows[0];
              if (!reservation) {
                return yield* new BillingStateError({
                  message: "Reservation not found",
                  reason: "reservation_missing",
                  retryable: false,
                });
              }
              if (reservation.status === "committed") {
                return;
              }
              if (reservation.status !== "pending") {
                return yield* new BillingStateError({
                  message: "Reservation is not pending",
                  reason: `reservation_${String(reservation.status)}`,
                  retryable: false,
                });
              }
              if (
                DateTime.toEpochMillis(
                  DateTime.fromDateUnsafe(reservation.expiresAt as Date)
                ) <= DateTime.toEpochMillis(yield* DateTime.now)
              ) {
                yield* sql`UPDATE quota_reservations SET status = 'expired'
                  WHERE id = ${id}`;
                return yield* new BillingStateError({
                  message: "Reservation has expired",
                  reason: "reservation_expired",
                  retryable: false,
                });
              }
              const updated = yield* sql<{
                id: string;
              }>`UPDATE subscriptions SET
                social_accounts = social_accounts + CASE WHEN ${reservation.resource} = 'socialAccounts' THEN ${reservation.amount} ELSE 0 END,
                monthly_posts = monthly_posts + CASE WHEN ${reservation.resource} = 'monthlyPosts' THEN ${reservation.amount} ELSE 0 END,
                media_storage_bytes = media_storage_bytes + CASE WHEN ${reservation.resource} = 'mediaStorageBytes' THEN ${reservation.amount} ELSE 0 END,
                api_requests_per_month = api_requests_per_month + CASE WHEN ${reservation.resource} = 'apiRequestsPerMonth' THEN ${reservation.amount} ELSE 0 END,
                dms_sent = dms_sent + CASE WHEN ${reservation.resource} = 'dmsSent' THEN ${reservation.amount} ELSE 0 END,
                transcriptions_used = transcriptions_used + CASE WHEN ${reservation.resource} = 'transcriptionsUsed' THEN ${reservation.amount} ELSE 0 END
                WHERE billing_owner_user_id = ${reservation.billingOwnerUserId}
                RETURNING id`;
              if (!updated[0]) {
                return yield* new BillingConcurrencyError({
                  message: "Subscription changed while committing reservation",
                  retryable: true,
                });
              }
              yield* sql`UPDATE quota_reservations SET status = 'committed',
                committed_at = now() WHERE id = ${id}`;
            })
          )
          .pipe(Effect.catchTag("SqlError", Effect.die));
      });

      const release = Effect.fn("PooledQuotaReservations.release")(function* (
        id: string
      ) {
        const rows = yield* sql<{ id: string }>`UPDATE quota_reservations
            SET status = 'released', released_at = now()
            WHERE id = ${id} AND status = 'pending' RETURNING id`.pipe(
          Effect.orDie
        );
        if (!rows[0]) {
          return yield* new BillingStateError({
            message: "Pending reservation not found",
            reason: "reservation_not_pending",
            retryable: false,
          });
        }
      });

      const expire = Effect.fn("PooledQuotaReservations.expire")(function* () {
        const rows = yield* sql<{ count: string }>`WITH expired AS (
          UPDATE quota_reservations SET status = 'expired'
          WHERE status = 'pending' AND expires_at <= now() RETURNING 1
        ) SELECT count(*)::text AS count FROM expired`.pipe(Effect.orDie);
        return Number(rows[0]?.count ?? 0);
      });

      return PooledQuotaReservations.of({ reserve, commit, release, expire });
    })
  );
}
