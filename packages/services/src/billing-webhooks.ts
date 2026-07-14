import { makeId, SubscriptionId, TransactionId } from "@delulu/core";
import {
  BillingStateError,
  type BillingWebhookEvent,
} from "@delulu/core/domain/billing";
import { Context, DateTime, Effect, Layer, Option } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { stopBilledWorkspaceWork } from "./subscription-access";

const optionalDate = (value: string | null): Date | null => {
  if (value === null) {
    return null;
  }
  return Option.match(DateTime.make(value), {
    onNone: () => null,
    onSome: DateTime.toDateUtc,
  });
};

/**
 * Transport-independent billing webhook application. The ingress verifies and
 * decodes provider payloads, then passes a normalized event here.
 */
export const applyBillingWebhook = Effect.fn("applyBillingWebhook")(function* (
  event: BillingWebhookEvent
) {
  const sql = yield* SqlClient.SqlClient;
  return yield* sql
    .withTransaction(
      Effect.gen(function* () {
        const claimed = yield* sql<{ providerEventId: string }>`
          INSERT INTO billing_webhook_events (provider_event_id, event_type, payload)
          VALUES (${event.eventId}, ${event._tag}, ${JSON.stringify(event)}::jsonb)
          ON CONFLICT (provider_event_id) DO NOTHING
          RETURNING provider_event_id`;
        if (!claimed[0]) {
          return { applied: false as const };
        }

        if (event._tag === "SubscriptionChanged") {
          if (
            (event.currentPeriodStart !== null &&
              optionalDate(event.currentPeriodStart) === null) ||
            (event.currentPeriodEnd !== null &&
              optionalDate(event.currentPeriodEnd) === null)
          ) {
            return yield* new BillingStateError({
              message: "Billing provider sent an invalid period",
              reason: "invalid_period",
              retryable: false,
            });
          }
          const id = makeId(SubscriptionId);
          const subscriptionChanges = yield* sql<{
            id: string;
          }>`INSERT INTO subscriptions
            (id, billing_owner_user_id, provider_customer_id,
              provider_subscription_id, plan, status, current_period_start,
              current_period_end, addons, billing_interval, currency,
              recurring_amount_minor, cancel_at_period_end, last_renewed_at,
              paid_since, provider_updated_at)
            VALUES (${id}, ${event.billingOwnerUserId}, ${event.providerCustomerId},
              ${event.providerSubscriptionId}, ${event.plan}, ${event.status},
              ${optionalDate(event.currentPeriodStart)},
              ${optionalDate(event.currentPeriodEnd)},
              ${JSON.stringify(event.addons ?? {})}::jsonb,
              ${event.billingInterval}, ${event.currency},
              ${event.recurringAmountMinor}, ${event.cancelAtPeriodEnd ?? false},
              ${event.providerEventType === "subscription.renewed" ? new Date() : null},
              ${event.status === "active" || event.status === "trialing" ? (optionalDate(event.currentPeriodStart) ?? new Date()) : null},
              ${optionalDate(event.providerOccurredAt ?? null)})
            ON CONFLICT (billing_owner_user_id) DO UPDATE SET
              provider_customer_id = EXCLUDED.provider_customer_id,
              provider_subscription_id = EXCLUDED.provider_subscription_id,
              plan = EXCLUDED.plan, status = EXCLUDED.status,
              monthly_posts = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN 0 ELSE subscriptions.monthly_posts END,
              api_requests_per_month = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN 0 ELSE subscriptions.api_requests_per_month END,
              dms_sent = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN 0 ELSE subscriptions.dms_sent END,
              dms_skipped = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN 0 ELSE subscriptions.dms_skipped END,
              transcriptions_used = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN 0 ELSE subscriptions.transcriptions_used END,
              api_requests_period_start = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN EXCLUDED.current_period_start ELSE subscriptions.api_requests_period_start END,
              dms_sent_period_start = CASE WHEN subscriptions.current_period_start IS DISTINCT FROM EXCLUDED.current_period_start THEN EXCLUDED.current_period_start ELSE subscriptions.dms_sent_period_start END,
              current_period_start = EXCLUDED.current_period_start,
              current_period_end = EXCLUDED.current_period_end,
              addons = EXCLUDED.addons,
              billing_interval = ${event.billingInterval},
              currency = ${event.currency},
              recurring_amount_minor = ${event.recurringAmountMinor},
              cancel_at_period_end = ${event.cancelAtPeriodEnd ?? false},
              last_renewed_at = CASE WHEN ${event.providerEventType === "subscription.renewed"} THEN now() ELSE subscriptions.last_renewed_at END,
              paid_since = COALESCE(subscriptions.paid_since, EXCLUDED.paid_since),
              provider_updated_at = EXCLUDED.provider_updated_at
            WHERE subscriptions.provider_updated_at IS NULL
              OR (EXCLUDED.provider_updated_at IS NOT NULL
                AND EXCLUDED.provider_updated_at >= subscriptions.provider_updated_at)
            RETURNING id`;
          if (!subscriptionChanges[0]) {
            return { applied: false as const, stale: true as const };
          }
          if (
            event.providerEventType === "subscription.cancelled" ||
            event.providerEventType === "subscription.expired"
          ) {
            const effective = yield* sql<{
              id: string;
            }>`UPDATE cancellation_requests SET status = 'effective'
              WHERE billing_owner_user_id = ${event.billingOwnerUserId}
                AND status = 'scheduled' RETURNING id`;
            if (effective[0]) {
              yield* stopBilledWorkspaceWork(event.billingOwnerUserId);
            }
          }
          if (
            event.cancelAtPeriodEnd !== true &&
            event.providerEventType !== "subscription.cancelled" &&
            event.providerEventType !== "subscription.expired"
          ) {
            yield* sql`UPDATE cancellation_requests SET status = 'reactivated',
              data_deletion_at = NULL
              WHERE billing_owner_user_id = ${event.billingOwnerUserId}
                AND status = 'scheduled'`;
            if (
              event.providerEventType === "subscription.active" &&
              event.providerSubscriptionId !== null
            ) {
              yield* sql`UPDATE cancellation_requests SET status = 'reactivated',
                data_deletion_at = NULL
                WHERE billing_owner_user_id = ${event.billingOwnerUserId}
                  AND status IN ('effective','deleting')
                  AND provider_subscription_id IS DISTINCT FROM ${event.providerSubscriptionId}`;
            }
          }
        } else {
          const id = makeId(TransactionId);
          yield* sql`INSERT INTO transactions
            (id, billing_owner_user_id, provider_transaction_id, amount_minor,
              currency, status, metadata)
            VALUES (${id}, ${event.billingOwnerUserId},
              ${event.providerTransactionId}, ${event.amountMinor},
              ${event.currency}, ${event.status},
              ${JSON.stringify(event.metadata)}::jsonb)
            ON CONFLICT (provider_transaction_id) DO UPDATE SET
              status = EXCLUDED.status, metadata = EXCLUDED.metadata`;
        }
        return { applied: true as const };
      })
    )
    .pipe(
      Effect.catchTag("SqlError", (cause) =>
        Effect.die(new Error("Unable to apply billing webhook", { cause }))
      )
    );
});

export class BillingWebhookApplication extends Context.Service<
  BillingWebhookApplication,
  {
    readonly apply: (
      event: BillingWebhookEvent
    ) => Effect.Effect<{ readonly applied: boolean }, BillingStateError>;
  }
>()("@delulu/services/BillingWebhookApplication") {
  static readonly layer = Layer.effect(
    BillingWebhookApplication,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      return BillingWebhookApplication.of({
        apply: (event) =>
          applyBillingWebhook(event).pipe(
            Effect.provideService(SqlClient.SqlClient, sql)
          ),
      });
    })
  );
}
