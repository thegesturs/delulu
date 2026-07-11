import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyPlanType = Schema.Literals(["FREE", "VIBE", "ECHO"]);
export type LegacyPlanType = typeof LegacyPlanType.Type;

export const LegacySubscriptionStatus = Schema.Literals([
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
  "UNPAID",
  "TRIALING",
]);

export const LegacySubscriptionMetadata = Schema.Struct({
  productId: Schema.optional(Schema.String),
  priceId: Schema.optional(Schema.String),
  cancelReason: Schema.optional(Schema.String),
});

export const LegacySubscription = Schema.Struct({
  ...SystemFields,
  userId: Schema.String,
  dodoCustomerId: Schema.String,
  dodoSubscriptionId: Schema.optional(Schema.String),
  planType: LegacyPlanType,
  status: LegacySubscriptionStatus,
  type: Schema.optional(Schema.Literals(["plan", "addon"])),
  addonType: Schema.optional(Schema.Literals(["sorted"])),
  billingPeriod: Schema.optional(
    Schema.Literals(["MONTHLY", "YEARLY", "LIFETIME"])
  ),
  currentPeriodStart: Schema.optional(Schema.Number),
  currentPeriodEnd: Schema.optional(Schema.Number),
  cancelAtPeriodEnd: Schema.optional(Schema.Boolean),
  trialEnd: Schema.optional(Schema.Number),
  metadata: Schema.optional(LegacySubscriptionMetadata),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacySubscription = typeof LegacySubscription.Type;

export const LegacyTransactionStatus = Schema.Literals([
  "SUCCEEDED",
  "PENDING",
  "FAILED",
  "REFUNDED",
]);

export const LegacyTransaction = Schema.Struct({
  ...SystemFields,
  userId: Schema.String,
  subscriptionId: Schema.optional(Schema.String),
  dodoPaymentId: Schema.String,
  dodoCustomerId: Schema.String,
  amount: Schema.Number,
  currency: Schema.String,
  status: LegacyTransactionStatus,
  description: Schema.optional(Schema.String),
  receiptUrl: Schema.optional(Schema.String),
  invoiceUrl: Schema.optional(Schema.String),
  failureReason: Schema.optional(Schema.String),
  metadata: Schema.optional(
    Schema.Struct({
      productId: Schema.optional(Schema.String),
      priceId: Schema.optional(Schema.String),
      webhookPayload: Schema.optional(Schema.String),
    })
  ),
  paidAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyTransaction = typeof LegacyTransaction.Type;
