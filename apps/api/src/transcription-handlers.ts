import { CHECKOUT_INITIATED } from "@delulu/analytics/events";
import { Api } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import {
  ProductAnalytics,
  TranscriptionCheckoutService,
  TranscriptionService,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthenticationLive } from "./auth-middleware";

export const TranscriptionHandlers = HttpApiBuilder.group(
  Api,
  "transcriptions",
  Effect.fnUntraced(function* (handlers) {
    const transcriptions = yield* TranscriptionService;
    const checkout = yield* TranscriptionCheckoutService;
    const analytics = yield* ProductAnalytics;
    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          return yield* transcriptions.list({
            userId: auth.userId,
            limit: Math.min(100, Math.max(1, query.limit ?? 10)),
            cursor: query.cursor,
          });
        })
      )
      .handle("usage", () =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          return yield* transcriptions.usageByUserId(auth.userId);
        })
      )
      .handle("checkout", ({ payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const session = yield* checkout.create({
            userId: auth.userId,
            productId: payload.productId,
          });
          yield* analytics.capture({
            distinctId: auth.userId,
            event: CHECKOUT_INITIATED,
            properties: {
              platform: "api",
              product: "transcription",
              product_id: payload.productId,
            },
          });
          return session;
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
