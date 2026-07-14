import { ValidationError } from "@delulu/contracts";
import {
  PROD_PRODUCT_IDS,
  PROD_PRODUCT_IDS_INR,
  TEST_PRODUCT_IDS,
  TEST_PRODUCT_IDS_INR,
} from "@delulu/payments";
import DodoPayments from "dodopayments";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { TranscriptionCheckoutConfig } from "./transcription-checkout";

type CheckoutPlan = "ECHO" | "VIBE";
type CheckoutInterval = "MONTHLY" | "YEARLY";
type CheckoutCurrency = "USD" | "INR";

const productIdFor = (
  environment: "test_mode" | "live_mode",
  plan: CheckoutPlan,
  interval: CheckoutInterval,
  currency: CheckoutCurrency
) => {
  const products =
    currency === "INR"
      ? environment === "live_mode"
        ? PROD_PRODUCT_IDS_INR
        : TEST_PRODUCT_IDS_INR
      : environment === "live_mode"
        ? PROD_PRODUCT_IDS
        : TEST_PRODUCT_IDS;
  return interval === "MONTHLY"
    ? products[plan].monthly
    : products[plan].yearly;
};

export class CheckoutService extends Context.Service<
  CheckoutService,
  {
    readonly create: (input: {
      readonly billingOwnerUserId: string;
      readonly workspaceId: string;
      readonly plan: CheckoutPlan;
      readonly interval: CheckoutInterval;
      readonly currency: CheckoutCurrency;
    }) => Effect.Effect<{ readonly checkoutUrl: string }, ValidationError>;
  }
>()("@delulu/services/CheckoutService") {
  static readonly layer = Layer.effect(
    CheckoutService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const config = yield* TranscriptionCheckoutConfig;
      const client = new DodoPayments({
        bearerToken: config.apiKey,
        environment: config.environment,
      });
      const create = Effect.fn("CheckoutService.create")(function* (input: {
        billingOwnerUserId: string;
        workspaceId: string;
        plan: CheckoutPlan;
        interval: CheckoutInterval;
        currency: CheckoutCurrency;
      }) {
        const users = yield* sql<{ email: string | null; name: string | null }>`
          SELECT email, name FROM users WHERE id = ${input.billingOwnerUserId}`.pipe(
          Effect.orDie
        );
        const user = users[0];
        if (!user?.email) {
          return yield* new ValidationError({
            message: "A billing email is required to start checkout",
            issues: [{ path: "email", message: "Billing email is required" }],
          });
        }
        const productId = productIdFor(
          config.environment,
          input.plan,
          input.interval,
          input.currency
        );
        return yield* Effect.tryPromise({
          try: async () => {
            const session = await client.checkoutSessions.create({
              product_cart: [{ product_id: productId, quantity: 1 }],
              customer: { email: user.email!, name: user.name ?? undefined },
              return_url: `${config.returnUrl}/onboarding?workspace=${encodeURIComponent(input.workspaceId)}`,
              billing_currency: input.currency,
              feature_flags: { allow_discount_code: true },
              metadata: {
                billing_owner_user_id: input.billingOwnerUserId,
                workspace_id: input.workspaceId,
              },
            });
            return { checkoutUrl: session.checkout_url };
          },
          catch: () =>
            new ValidationError({
              message: "Unable to create checkout session",
              issues: [{ path: "plan", message: "Checkout session failed" }],
            }),
        });
      });
      return CheckoutService.of({ create });
    })
  );
}
