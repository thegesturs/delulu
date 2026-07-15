import { DateTime, Schema } from "effect";

export const PooledQuotaResource = Schema.Literals([
  "socialAccounts",
  "monthlyPosts",
  "mediaStorageBytes",
  "apiRequestsPerMonth",
  "dmsSent",
  "transcriptionsUsed",
]);
export type PooledQuotaResource = typeof PooledQuotaResource.Type;

export const PooledUsage = Schema.Struct({
  socialAccounts: Schema.Number,
  monthlyPosts: Schema.Number,
  mediaStorageBytes: Schema.Number,
  apiRequestsPerMonth: Schema.Number,
  dmsSent: Schema.Number,
  dmsSkipped: Schema.Number,
  transcriptionsUsed: Schema.Number,
});
export type PooledUsage = typeof PooledUsage.Type;

export const BillingOwnerTransferStatus = Schema.Literals([
  "pending",
  "accepted",
  "cancelled",
  "expired",
]);
export type BillingOwnerTransferStatus = typeof BillingOwnerTransferStatus.Type;

export const BillingOwnerTransfer = Schema.Struct({
  id: Schema.String,
  workspaceId: Schema.String,
  fromUserId: Schema.String,
  toUserId: Schema.String,
  requestedByUserId: Schema.String,
  status: BillingOwnerTransferStatus,
  expiresAt: Schema.String,
  acceptedAt: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
});
export type BillingOwnerTransfer = typeof BillingOwnerTransfer.Type;

export const BillingWebhookEvent = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("SubscriptionChanged"),
    eventId: Schema.String,
    providerEventType: Schema.String,
    providerOccurredAt: Schema.optional(Schema.NullOr(Schema.String)),
    billingOwnerUserId: Schema.String,
    providerCustomerId: Schema.NullOr(Schema.String),
    providerSubscriptionId: Schema.NullOr(Schema.String),
    plan: Schema.String,
    status: Schema.String,
    currentPeriodStart: Schema.NullOr(Schema.String),
    currentPeriodEnd: Schema.NullOr(Schema.String),
    billingInterval: Schema.NullOr(Schema.String),
    currency: Schema.NullOr(Schema.String),
    recurringAmountMinor: Schema.NullOr(Schema.Number),
    cancelAtPeriodEnd: Schema.Boolean,
  }),
  Schema.Struct({
    _tag: Schema.Literal("AddonSubscriptionChanged"),
    eventId: Schema.String,
    providerEventType: Schema.String,
    providerOccurredAt: Schema.optional(Schema.NullOr(Schema.String)),
    billingOwnerUserId: Schema.String,
    providerCustomerId: Schema.NullOr(Schema.String),
    providerSubscriptionId: Schema.String,
    addon: Schema.Literal("sorted"),
    status: Schema.String,
    currentPeriodStart: Schema.NullOr(Schema.String),
    currentPeriodEnd: Schema.NullOr(Schema.String),
    cancelAtPeriodEnd: Schema.Boolean,
  }),
  Schema.Struct({
    _tag: Schema.Literal("UnrecognizedSubscriptionChanged"),
    eventId: Schema.String,
    providerEventType: Schema.String,
    providerOccurredAt: Schema.optional(Schema.NullOr(Schema.String)),
    billingOwnerUserId: Schema.String,
    providerCustomerId: Schema.NullOr(Schema.String),
    providerSubscriptionId: Schema.String,
    productId: Schema.String,
    status: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("TransactionChanged"),
    eventId: Schema.String,
    providerEventType: Schema.String,
    providerOccurredAt: Schema.optional(Schema.NullOr(Schema.String)),
    billingOwnerUserId: Schema.String,
    providerTransactionId: Schema.String,
    amountMinor: Schema.Number,
    currency: Schema.String,
    status: Schema.String,
    metadata: Schema.Record(Schema.String, Schema.Unknown),
  }),
]);
export type BillingWebhookEvent = typeof BillingWebhookEvent.Type;

export class BillingStateError extends Schema.TaggedErrorClass<BillingStateError>()(
  "BillingStateError",
  { message: Schema.String, reason: Schema.String, retryable: Schema.Boolean }
) {}

export class BillingConcurrencyError extends Schema.TaggedErrorClass<BillingConcurrencyError>()(
  "BillingConcurrencyError",
  { message: Schema.String, retryable: Schema.Boolean }
) {}

export const transferIsExpired = (
  expiresAt: DateTime.DateTime,
  now: DateTime.DateTime
): boolean => DateTime.toEpochMillis(expiresAt) <= DateTime.toEpochMillis(now);

export const canInitiateBillingTransfer = (input: {
  readonly actorUserId: string;
  readonly currentBillingOwnerUserId: string;
  readonly actorRole: "owner" | "admin" | "editor" | "viewer";
}): boolean =>
  input.actorRole === "owner" ||
  input.actorUserId === input.currentBillingOwnerUserId;
