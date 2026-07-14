import { BillingOwnerTransfer, PooledUsage } from "@delulu/core/domain/billing";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import {
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
];

export const SubscriptionResponse = Schema.Struct({
  id: Schema.String,
  billingOwnerUserId: Schema.String,
  plan: Schema.String,
  status: Schema.String,
  currentPeriodStart: Schema.NullOr(Schema.String),
  currentPeriodEnd: Schema.NullOr(Schema.String),
  addons: Schema.Record(Schema.String, Schema.Unknown),
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
    })
  )
  .add(
    HttpApiEndpoint.post("checkout", "/checkout", {
      params: WorkspacePath,
      payload: Schema.Struct({
        plan: Schema.Literals(["ECHO", "VIBE"]),
        interval: Schema.Literals(["MONTHLY", "YEARLY"]),
        currency: Schema.Literals(["USD", "INR"]),
      }),
      success: Schema.Struct({ checkoutUrl: Schema.String }),
      error: billingErrors,
    })
  )
  .middleware(Authentication)
  .prefix("/v1/workspaces/:workspaceId/billing")
  .annotate(OpenApi.Title, "Billing");
