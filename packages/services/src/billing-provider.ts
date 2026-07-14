import { ConflictError } from "@delulu/contracts";
import {
  PROD_PRODUCT_IDS,
  PROD_PRODUCT_IDS_INR,
  TEST_PRODUCT_IDS,
  TEST_PRODUCT_IDS_INR,
} from "@delulu/payments";
import DodoPayments from "dodopayments";
import { Context, Effect, Layer } from "effect";
import type { CancellationReason } from "./cancellation-policy";

export class BillingProviderConfig extends Context.Service<
  BillingProviderConfig,
  {
    readonly apiKey: string;
    readonly environment: "test_mode" | "live_mode";
    readonly appBaseUrl: string;
  }
>()("@delulu/services/BillingProviderConfig") {}

const providerError = (message: string) =>
  new ConflictError({ message, resource: "subscription" });

export class BillingProviderService extends Context.Service<
  BillingProviderService,
  {
    readonly scheduleCancellation: (input: {
      readonly subscriptionId: string;
      readonly reason: CancellationReason;
      readonly comment?: string;
    }) => Effect.Effect<Readonly<Record<string, unknown>>, ConflictError>;
    readonly undoCancellation: (
      subscriptionId: string
    ) => Effect.Effect<Readonly<Record<string, unknown>>, ConflictError>;
    readonly creditWallet: (input: {
      readonly customerId: string;
      readonly amountMinor: number;
      readonly currency: string;
      readonly idempotencyKey: string;
    }) => Effect.Effect<void, ConflictError>;
    readonly portal: (
      customerId: string
    ) => Effect.Effect<string, ConflictError>;
    readonly checkout: (input: {
      readonly customerId?: string;
      readonly email?: string;
      readonly name?: string;
      readonly billingOwnerUserId: string;
      readonly plan: string;
      readonly billingInterval: string | null;
      readonly currency: string | null;
      readonly returnPath?: string;
    }) => Effect.Effect<string, ConflictError>;
  }
>()("@delulu/services/BillingProviderService") {
  static readonly layer = Layer.effect(
    BillingProviderService,
    Effect.gen(function* () {
      const config = yield* BillingProviderConfig;
      const client = new DodoPayments({
        bearerToken: config.apiKey,
        environment: config.environment,
      });
      const update = (subscriptionId: string, body: Record<string, unknown>) =>
        Effect.tryPromise({
          try: () =>
            client.subscriptions.update(
              subscriptionId,
              body as never
            ) as unknown as Promise<Record<string, unknown>>,
          catch: () =>
            providerError("Billing provider rejected the subscription update"),
        });
      return BillingProviderService.of({
        scheduleCancellation: (input) =>
          update(input.subscriptionId, {
            cancel_at_next_billing_date: true,
            cancel_reason: "cancelled_by_customer",
            cancellation_feedback: input.reason,
            cancellation_comment: input.comment ?? null,
          }),
        undoCancellation: (subscriptionId) =>
          update(subscriptionId, { cancel_at_next_billing_date: false }),
        creditWallet: (input) =>
          Effect.tryPromise({
            try: async () => {
              await client.customers.wallets.ledgerEntries.create(
                input.customerId,
                {
                  amount: input.amountMinor,
                  currency: input.currency as never,
                  entry_type: "credit",
                  idempotency_key: input.idempotencyKey,
                  reason: "One-cycle retention credit",
                }
              );
            },
            catch: () => providerError("Unable to apply the retention credit"),
          }),
        portal: (customerId) =>
          Effect.tryPromise({
            try: async () =>
              (
                await client.customers.customerPortal.create(customerId, {
                  send_email: false,
                })
              ).link,
            catch: () => providerError("Unable to open billing management"),
          }),
        checkout: (input) =>
          Effect.tryPromise({
            try: async () => {
              if (input.plan !== "ECHO" && input.plan !== "VIBE") {
                throw new Error("Unsupported recovery plan");
              }
              const products =
                config.environment === "live_mode"
                  ? input.currency === "INR"
                    ? PROD_PRODUCT_IDS_INR
                    : PROD_PRODUCT_IDS
                  : input.currency === "INR"
                    ? TEST_PRODUCT_IDS_INR
                    : TEST_PRODUCT_IDS;
              const productId =
                input.billingInterval === "YEARLY"
                  ? products[input.plan].yearly
                  : products[input.plan].monthly;
              return (
                await client.checkoutSessions.create({
                  product_cart: [{ product_id: productId, quantity: 1 }],
                  customer: input.customerId
                    ? { customer_id: input.customerId }
                    : {
                        email: input.email ?? "",
                        name: input.name ?? "Customer",
                      },
                  metadata: {
                    billing_owner_user_id: input.billingOwnerUserId,
                    recovery: "true",
                  },
                  return_url: `${config.appBaseUrl}${input.returnPath ?? "/billing?status=active"}`,
                  show_saved_payment_methods: true,
                })
              ).checkout_url;
            },
            catch: () => providerError("Unable to start recovery checkout"),
          }),
      });
    })
  );
}
