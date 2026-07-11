import {
  WebhookIngressError,
  type WebhookProvider,
} from "@delulu/core/domain/webhook-delivery";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

export type DeliveryClaim =
  | { readonly _tag: "Acquired"; readonly deliveryId: string }
  | { readonly _tag: "Duplicate" };

const persistenceError = (message: string) =>
  new WebhookIngressError({
    reason: "processing_failed",
    message,
    retryable: true,
  });

export class WebhookDeliveryService extends Context.Service<
  WebhookDeliveryService,
  {
    readonly claim: (input: {
      readonly provider: WebhookProvider;
      readonly eventId: string;
      readonly payload: string;
    }) => Effect.Effect<DeliveryClaim, WebhookIngressError>;
    readonly complete: (
      deliveryId: string
    ) => Effect.Effect<void, WebhookIngressError>;
    readonly fail: (
      deliveryId: string,
      message: string
    ) => Effect.Effect<void, WebhookIngressError>;
  }
>()("@delulu/services/WebhookDeliveryService") {
  static readonly layer = Layer.effect(
    WebhookDeliveryService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const claim = Effect.fn("WebhookDeliveryService.claim")(
        function* (input: {
          readonly provider: WebhookProvider;
          readonly eventId: string;
          readonly payload: string;
        }) {
          const deliveryId = `delivery_${crypto.randomUUID()}`;
          const inserted = yield* sql<{ id: string }>`
          INSERT INTO webhook_deliveries (id, provider, event_id, status, payload)
          VALUES (${deliveryId}, ${input.provider}, ${input.eventId}, 'processing', ${input.payload}::jsonb)
          ON CONFLICT (provider, event_id) DO NOTHING
          RETURNING id
        `.pipe(
            Effect.mapError(() =>
              persistenceError("Unable to claim webhook delivery")
            )
          );
          if (inserted[0]) {
            return { _tag: "Acquired", deliveryId: inserted[0].id } as const;
          }

          const retried = yield* sql<{ id: string }>`
          UPDATE webhook_deliveries
          SET status = 'processing', attempts = attempts + 1, last_error = NULL
          WHERE provider = ${input.provider} AND event_id = ${input.eventId}
            AND (status = 'failed' OR (status = 'processing' AND updated_at < now() - interval '5 minutes'))
          RETURNING id
        `.pipe(
            Effect.mapError(() =>
              persistenceError("Unable to reclaim webhook delivery")
            )
          );
          return retried[0]
            ? ({ _tag: "Acquired", deliveryId: retried[0].id } as const)
            : ({ _tag: "Duplicate" } as const);
        }
      );
      const complete = Effect.fn("WebhookDeliveryService.complete")(function* (
        deliveryId: string
      ) {
        yield* sql`UPDATE webhook_deliveries SET status = 'processed', processed_at = now(), last_error = NULL WHERE id = ${deliveryId}`.pipe(
          Effect.mapError(() =>
            persistenceError("Unable to complete webhook delivery")
          )
        );
      });
      const fail = Effect.fn("WebhookDeliveryService.fail")(function* (
        deliveryId: string,
        message: string
      ) {
        yield* sql`UPDATE webhook_deliveries SET status = 'failed', last_error = ${message} WHERE id = ${deliveryId}`.pipe(
          Effect.mapError(() =>
            persistenceError("Unable to mark webhook delivery failed")
          )
        );
      });
      return WebhookDeliveryService.of({ claim, complete, fail });
    })
  );
}
