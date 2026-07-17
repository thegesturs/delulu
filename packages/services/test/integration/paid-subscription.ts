import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";

export const provisionPaidSubscription = Effect.fn(
  "test.provisionPaidSubscription"
)(function* (billingOwnerUserId: string, plan = "ECHO") {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`INSERT INTO subscriptions
    (id, billing_owner_user_id, provider_customer_id, provider_subscription_id,
      plan, status, current_period_start, current_period_end, billing_interval,
      currency, recurring_amount_minor)
    VALUES (${`subscription_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`},
      ${billingOwnerUserId}, ${`customer_${crypto.randomUUID()}`},
      ${`provider_subscription_${crypto.randomUUID()}`}, ${plan}, 'active',
      now() - interval '31 days', now() + interval '30 days', 'MONTHLY', 'USD', 1000)
    ON CONFLICT (billing_owner_user_id) DO UPDATE SET plan = ${plan}, status = 'active'`;
});
