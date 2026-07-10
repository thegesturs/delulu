import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { SubscriptionId, UserId } from "../kernel/ids";
import {
  BigIntValue,
  domainErrorFields,
  entityFields,
  repository,
} from "./shared";

export class Subscription extends Model.Class<Subscription>("Subscription")({
  ...entityFields(SubscriptionId),
  billingOwnerUserId: UserId,
  providerCustomerId: Schema.NullOr(Schema.String),
  providerSubscriptionId: Schema.NullOr(Schema.String),
  plan: Schema.String,
  status: Schema.String,
  currentPeriodStart: Schema.NullOr(Schema.DateTimeUtcFromDate),
  currentPeriodEnd: Schema.NullOr(Schema.DateTimeUtcFromDate),
  monthlyPosts: BigIntValue,
  mediaStorageBytes: BigIntValue,
  dmsSent: BigIntValue,
  dmsSkipped: BigIntValue,
  transcriptionsUsed: BigIntValue,
}) {}
export class SubscriptionError extends Schema.TaggedErrorClass<SubscriptionError>()(
  "SubscriptionError",
  domainErrorFields
) {}
export const makeSubscriptionRepository = Effect.fn(
  "makeSubscriptionRepository"
)(() =>
  repository(Subscription, "id", "subscriptions", "SubscriptionRepository")
);
