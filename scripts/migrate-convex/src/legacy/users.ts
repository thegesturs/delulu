import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyUsage = Schema.Struct({
  socialAccounts: Schema.optional(Schema.Number),
  monthlyPosts: Schema.optional(Schema.Number),
  monthlyPostsPeriodStart: Schema.optional(Schema.Number),
  mediaStorageBytes: Schema.optional(Schema.Number),
  dmsSent: Schema.optional(Schema.Number),
  transcriptionsUsed: Schema.optional(Schema.Number),
  transcriptionPeriodStart: Schema.optional(Schema.Number),
});
export type LegacyUsage = typeof LegacyUsage.Type;

export const LegacyUser = Schema.Struct({
  ...SystemFields,
  email: Schema.String,
  name: Schema.String,
  emailVerified: Schema.optional(Schema.Boolean),
  externalId: Schema.optional(Schema.String),
  usage: Schema.optional(LegacyUsage),
  stats: Schema.optional(
    Schema.Struct({
      publishDates: Schema.optional(Schema.Array(Schema.Number)),
    })
  ),
  image: Schema.optional(Schema.String),
  dodoCustomerId: Schema.optional(Schema.String),
  subscriptionId: Schema.optional(Schema.String),
  addonSubscriptionIds: Schema.optional(Schema.Array(Schema.String)),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyUser = typeof LegacyUser.Type;
