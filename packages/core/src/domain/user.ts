import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { UserId } from "../kernel/ids";
import {
  BigIntValue,
  domainErrorFields,
  entityFields,
  repository,
} from "./shared";

export class User extends Model.Class<User>("User")({
  ...entityFields(UserId),
  externalId: Schema.String,
  email: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  imageUrl: Schema.NullOr(Schema.String),
  monthlyPosts: BigIntValue,
  monthlyPostsPeriodStart: Schema.NullOr(Schema.DateTimeUtcFromDate),
  dmsSent: BigIntValue,
  dmsSentPeriodStart: Schema.NullOr(Schema.DateTimeUtcFromDate),
  transcriptionsUsed: BigIntValue,
  transcriptionsPeriodStart: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class UserError extends Schema.TaggedErrorClass<UserError>()(
  "UserError",
  domainErrorFields
) {}
export const makeUserRepository = Effect.fn("makeUserRepository")(() =>
  repository(User, "id", "users", "UserRepository")
);
