import { NotFoundError } from "@delulu/contracts";
import type { PooledUsage } from "@delulu/core/domain/billing";
import { Context, DateTime, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

const isoNullable = (value: Date | null): string | null =>
  value === null ? null : DateTime.formatIso(DateTime.fromDateUnsafe(value));

export interface SubscriptionSummary {
  readonly id: string;
  readonly billingOwnerUserId: string;
  readonly plan: string;
  readonly status: string;
  readonly currentPeriodStart: string | null;
  readonly currentPeriodEnd: string | null;
  readonly addons: Readonly<Record<string, unknown>>;
  readonly billingInterval: string | null;
  readonly currency: string | null;
  readonly recurringAmountMinor: number | null;
  readonly cancelAtPeriodEnd: boolean;
}

export interface BillingTransactionSummary {
  readonly id: string;
  readonly providerTransactionId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: string;
  readonly createdAt: string;
}

export class BillingService extends Context.Service<
  BillingService,
  {
    readonly subscription: (
      billingOwnerUserId: string
    ) => Effect.Effect<SubscriptionSummary, NotFoundError>;
    readonly usage: (billingOwnerUserId: string) => Effect.Effect<
      {
        readonly billingOwnerUserId: string;
        readonly usage: PooledUsage;
      },
      NotFoundError
    >;
    readonly transactions: (input: {
      readonly billingOwnerUserId: string;
      readonly limit: number;
      readonly offset: number;
    }) => Effect.Effect<{
      readonly data: readonly BillingTransactionSummary[];
      readonly total: number;
      readonly limit: number;
      readonly offset: number;
    }>;
  }
>()("@delulu/services/BillingService") {
  static readonly layer = Layer.effect(
    BillingService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const find = Effect.fn("BillingService.find")(function* (
        billingOwnerUserId: string
      ) {
        const rows = yield* sql<Record<string, unknown>>`SELECT s.*,
          COALESCE((
            SELECT jsonb_object_agg(a.addon_key, jsonb_strip_nulls(jsonb_build_object(
              'status', a.status,
              'providerSubscriptionId', a.provider_subscription_id,
              'currentPeriodStart', a.current_period_start,
              'currentPeriodEnd', a.current_period_end,
              'cancelAtPeriodEnd', a.cancel_at_period_end
            )))
            FROM subscription_addons a
            WHERE a.base_subscription_id = s.id
          ), '{}'::jsonb) AS addons
          FROM subscriptions s
          WHERE s.billing_owner_user_id = ${billingOwnerUserId}`.pipe(
          Effect.orDie
        );
        const row = rows[0];
        if (!row) {
          return yield* new NotFoundError({
            message: "Subscription not found",
            resource: "subscription",
          });
        }
        return row;
      });
      const subscription = Effect.fn("BillingService.subscription")(function* (
        billingOwnerUserId: string
      ) {
        const row = yield* find(billingOwnerUserId);
        return {
          id: String(row.id),
          billingOwnerUserId: String(row.billingOwnerUserId),
          plan: String(row.plan),
          status: String(row.status),
          currentPeriodStart: isoNullable(
            row.currentPeriodStart as Date | null
          ),
          currentPeriodEnd: isoNullable(row.currentPeriodEnd as Date | null),
          addons: (row.addons ?? {}) as Readonly<Record<string, unknown>>,
          billingInterval:
            row.billingInterval === null ? null : String(row.billingInterval),
          currency: row.currency === null ? null : String(row.currency),
          recurringAmountMinor:
            row.recurringAmountMinor === null
              ? null
              : Number(row.recurringAmountMinor),
          cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
        };
      });
      const usage = Effect.fn("BillingService.usage")(function* (
        billingOwnerUserId: string
      ) {
        const row = yield* find(billingOwnerUserId);
        return {
          billingOwnerUserId,
          usage: {
            socialAccounts: Number(row.socialAccounts),
            monthlyPosts: Number(row.monthlyPosts),
            mediaStorageBytes: Number(row.mediaStorageBytes),
            apiRequestsPerMonth: Number(row.apiRequestsPerMonth),
            dmsSent: Number(row.dmsSent),
            dmsSkipped: Number(row.dmsSkipped),
            transcriptionsUsed: Number(row.transcriptionsUsed),
          },
        };
      });
      const transactions = Effect.fn("BillingService.transactions")(
        function* (input: {
          readonly billingOwnerUserId: string;
          readonly limit: number;
          readonly offset: number;
        }) {
          const rows = yield* sql<Record<string, unknown>>`SELECT id,
            provider_transaction_id, amount_minor, currency, status, created_at
            FROM transactions WHERE billing_owner_user_id = ${input.billingOwnerUserId}
            ORDER BY created_at DESC LIMIT ${input.limit} OFFSET ${input.offset}`.pipe(
            Effect.orDie
          );
          const total = yield* sql<{
            count: string;
          }>`SELECT count(*)::text AS count
            FROM transactions WHERE billing_owner_user_id = ${input.billingOwnerUserId}`.pipe(
            Effect.orDie
          );
          return {
            data: rows.map((row) => ({
              id: String(row.id),
              providerTransactionId: String(row.providerTransactionId),
              amountMinor: Number(row.amountMinor),
              currency: String(row.currency),
              status: String(row.status),
              createdAt: DateTime.formatIso(
                DateTime.fromDateUnsafe(row.createdAt as Date)
              ),
            })),
            total: Number(total[0]?.count ?? 0),
            limit: input.limit,
            offset: input.offset,
          };
        }
      );
      return BillingService.of({ subscription, usage, transactions });
    })
  );
}
