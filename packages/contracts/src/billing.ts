import { BillingOwnerTransfer, PooledUsage } from "@delulu/core/domain/billing";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import {
  BillingDisabledResponse,
  ConflictErrorResponse,
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  ValidationErrorResponse,
} from "./errors";
import { Authentication } from "./middleware";

const WorkspacePath = { workspaceId: Schema.String };
const ResourcePath = { workspaceId: Schema.String, id: Schema.String };
const billingErrors = [
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  ConflictErrorResponse,
  ValidationErrorResponse,
  BillingDisabledResponse,
];

export const SubscriptionResponse = Schema.Struct({
  id: Schema.String,
  billingOwnerUserId: Schema.String,
  plan: Schema.String,
  status: Schema.String,
  currentPeriodStart: Schema.NullOr(Schema.String),
  currentPeriodEnd: Schema.NullOr(Schema.String),
  addons: Schema.Record(Schema.String, Schema.Unknown),
  billingInterval: Schema.NullOr(Schema.String),
  currency: Schema.NullOr(Schema.String),
  recurringAmountMinor: Schema.NullOr(Schema.Number),
  cancelAtPeriodEnd: Schema.Boolean,
  canManageBilling: Schema.Boolean,
});

export const CancellationReason = Schema.Literals([
  "too_expensive",
  "missing_features",
  "switched_service",
  "unused",
  "customer_service",
  "low_quality",
  "too_complex",
  "other",
]);

export const CancellationImpact = Schema.Struct({
  workspaces: Schema.Number,
  members: Schema.Number,
  posts: Schema.Number,
  scheduledPosts: Schema.Number,
  automations: Schema.Number,
  connections: Schema.Number,
  apiKeys: Schema.Number,
  mediaItems: Schema.Number,
  mediaBytes: Schema.Number,
  automationContacts: Schema.Number,
  automationRuns: Schema.Number,
  transcriptions: Schema.Number,
  workspaceNames: Schema.Array(Schema.String),
});

export const CancellationResponse = Schema.Struct({
  id: Schema.NullOr(Schema.String),
  status: Schema.NullOr(Schema.String),
  reason: Schema.NullOr(CancellationReason),
  comment: Schema.NullOr(Schema.String),
  currentPeriodEnd: Schema.NullOr(Schema.String),
  dataDeletionAt: Schema.NullOr(Schema.String),
  impact: CancellationImpact,
  canOfferSave: Schema.Boolean,
  offerAmountMinor: Schema.NullOr(Schema.Number),
  offerCurrency: Schema.NullOr(Schema.String),
  calendarReference: Schema.NullOr(Schema.String),
  calendarBookingAt: Schema.NullOr(Schema.String),
  recoveryUrl: Schema.NullOr(Schema.String),
  canManageCancellation: Schema.Boolean,
});

export const UsageResponse = Schema.Struct({
  billingOwnerUserId: Schema.String,
  usage: PooledUsage,
});

export const TransactionResponse = Schema.Struct({
  id: Schema.String,
  providerTransactionId: Schema.String,
  amountMinor: Schema.Number,
  currency: Schema.String,
  status: Schema.String,
  createdAt: Schema.String,
});

export const BillingTransferResponse = BillingOwnerTransfer;

export const BillingGroup = HttpApiGroup.make("billing")
  .add(
    HttpApiEndpoint.get("subscription", "/subscription", {
      params: WorkspacePath,
      success: SubscriptionResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.get("usage", "/usage", {
      params: WorkspacePath,
      success: UsageResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.get("transactions", "/transactions", {
      params: WorkspacePath,
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Struct({
        data: Schema.Array(TransactionResponse),
        total: Schema.Number,
        limit: Schema.Number,
        offset: Schema.Number,
      }),
      error: billingErrors,
    }),
    HttpApiEndpoint.post("portal", "/portal", {
      params: WorkspacePath,
      success: Schema.Struct({ url: Schema.String }),
      error: billingErrors,
    }),
    HttpApiEndpoint.post("checkout", "/checkout", {
      params: WorkspacePath,
      payload: Schema.Struct({
        plan: Schema.Literals(["ECHO", "VIBE"]),
        interval: Schema.Literals(["MONTHLY", "YEARLY"]),
        currency: Schema.Literals(["USD", "INR"]),
        returnPath: Schema.optional(Schema.String),
        idempotencyKey: Schema.optional(Schema.String),
      }),
      success: Schema.Struct({ url: Schema.String }),
      error: billingErrors,
    }),
    HttpApiEndpoint.get("transfers", "/transfers", {
      params: WorkspacePath,
      success: Schema.Array(BillingTransferResponse),
      error: billingErrors,
    }),
    HttpApiEndpoint.post("requestTransfer", "/transfers", {
      params: WorkspacePath,
      payload: Schema.Struct({ toUserId: Schema.String }),
      success: BillingTransferResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.post("acceptTransfer", "/transfers/:id/accept", {
      params: ResourcePath,
      success: BillingTransferResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.post("cancelTransfer", "/transfers/:id/cancel", {
      params: ResourcePath,
      success: BillingTransferResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.get("cancellation", "/cancellation", {
      params: WorkspacePath,
      success: CancellationResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.post("startCancellation", "/cancellation/start", {
      params: WorkspacePath,
      payload: Schema.Struct({
        reason: CancellationReason,
        comment: Schema.optional(Schema.String),
      }),
      success: CancellationResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.post(
      "acceptCancellationOffer",
      "/cancellation/:id/accept-offer",
      {
        params: ResourcePath,
        success: CancellationResponse,
        error: billingErrors,
      }
    ),
    HttpApiEndpoint.post("scheduleCancellation", "/cancellation/:id/schedule", {
      params: ResourcePath,
      payload: Schema.Struct({ confirmation: Schema.String }),
      success: CancellationResponse,
      error: billingErrors,
    }),
    HttpApiEndpoint.post(
      "reactivateCancellation",
      "/cancellation/:id/reactivate",
      {
        params: ResourcePath,
        success: CancellationResponse,
        error: billingErrors,
      }
    ),
    HttpApiEndpoint.post("abandonCancellation", "/cancellation/:id/abandon", {
      params: ResourcePath,
      success: CancellationResponse,
      error: billingErrors,
    })
  )
  .middleware(Authentication)
  .prefix("/v1/workspaces/:workspaceId/billing")
  .annotate(OpenApi.Title, "Billing");
