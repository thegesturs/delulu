import { ValidationError } from "@delulu/contracts";
import DodoPayments from "dodopayments";
import { Config, Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

export class TranscriptionCheckoutConfig extends Context.Service<
  TranscriptionCheckoutConfig,
  {
    readonly apiKey: string;
    readonly environment: "test_mode" | "live_mode";
    readonly returnUrl: string;
  }
>()("@delulu/services/TranscriptionCheckoutConfig") {
  static readonly layer = Layer.effect(
    TranscriptionCheckoutConfig,
    Effect.gen(function* () {
      const apiKey = yield* Config.string("DODO_PAYMENTS_API_KEY");
      const environment = yield* Config.literals(
        ["test_mode", "live_mode"],
        "DODO_PAYMENTS_ENVIRONMENT"
      ).pipe(Config.withDefault("test_mode"));
      const returnUrl = yield* Config.string("APP_BASE_URL").pipe(
        Config.withDefault("http://localhost:3000")
      );
      return TranscriptionCheckoutConfig.of({ apiKey, environment, returnUrl });
    })
  );
}

export class TranscriptionCheckoutService extends Context.Service<
  TranscriptionCheckoutService,
  {
    readonly create: (input: {
      readonly userId: string;
      readonly productId: string;
    }) => Effect.Effect<{ readonly checkoutUrl: string }, ValidationError>;
  }
>()("@delulu/services/TranscriptionCheckoutService") {
  static readonly layer = Layer.effect(
    TranscriptionCheckoutService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const config = yield* TranscriptionCheckoutConfig;
      const client = new DodoPayments({
        bearerToken: config.apiKey,
        environment: config.environment,
      });
      const create = Effect.fn("TranscriptionCheckoutService.create")(
        function* (input: {
          readonly userId: string;
          readonly productId: string;
        }) {
          const users = yield* sql<{
            email: string | null;
            name: string | null;
          }>`
            SELECT email, name FROM users WHERE id = ${input.userId}`.pipe(
            Effect.orDie
          );
          const user = users[0];
          if (!user?.email) {
            return yield* new ValidationError({
              message: "A billing email is required to start checkout",
              issues: [{ path: "email", message: "Billing email is required" }],
            });
          }
          const email = user.email;
          return yield* Effect.tryPromise({
            try: async () => {
              const session = await client.checkoutSessions.create({
                product_cart: [{ product_id: input.productId, quantity: 1 }],
                customer: { email, name: user.name ?? undefined },
                return_url: config.returnUrl,
                billing_currency: "USD",
                feature_flags: { allow_discount_code: true },
              });
              return { checkoutUrl: session.checkout_url };
            },
            catch: () =>
              new ValidationError({
                message: "Unable to create checkout session",
                issues: [
                  { path: "productId", message: "Checkout session failed" },
                ],
              }),
          });
        }
      );
      return TranscriptionCheckoutService.of({ create });
    })
  );
}
