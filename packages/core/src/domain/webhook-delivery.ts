import { Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { entityFields, JsonObject } from "./shared";

export const WebhookDeliveryId = Schema.String.pipe(
  Schema.brand("WebhookDeliveryId")
);
export type WebhookDeliveryId = typeof WebhookDeliveryId.Type;

export const WebhookProvider = Schema.Literals(["meta", "clerk", "dodo"]);
export type WebhookProvider = typeof WebhookProvider.Type;

export const WebhookDeliveryStatus = Schema.Literals([
  "processing",
  "processed",
  "failed",
]);

export class WebhookDelivery extends Model.Class<WebhookDelivery>(
  "WebhookDelivery"
)({
  ...entityFields(WebhookDeliveryId),
  provider: WebhookProvider,
  eventId: Schema.String,
  status: WebhookDeliveryStatus,
  attempts: Schema.Number,
  payload: JsonObject,
  lastError: Schema.NullOr(Schema.String),
  processedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}

export class WebhookIngressError extends Schema.TaggedErrorClass<WebhookIngressError>()(
  "WebhookIngressError",
  {
    reason: Schema.Literals([
      "missing_header",
      "invalid_signature",
      "stale_timestamp",
      "invalid_payload",
      "processing_failed",
    ]),
    message: Schema.String,
    retryable: Schema.Boolean,
  }
) {}
