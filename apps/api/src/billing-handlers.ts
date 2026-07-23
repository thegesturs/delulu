import { Api, ConflictError, ForbiddenError } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import {
  BillingOwnerTransfers,
  BillingProviderService,
  BillingService,
  CancellationService,
  EntitlementPolicy,
  WorkspaceAccessService,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { SqlClient } from "effect/unstable/sql";
import { AuthenticationLive } from "./auth-middleware";

const page = (query: {
  readonly limit?: number;
  readonly offset?: number;
}) => ({
  limit: Math.min(100, Math.max(1, query.limit ?? 20)),
  offset: Math.max(0, query.offset ?? 0),
});

export const BillingHandlers = HttpApiBuilder.group(
  Api,
  "billing",
  Effect.fnUntraced(function* (handlers) {
    const billing = yield* BillingService;
    const transfers = yield* BillingOwnerTransfers;
    const cancellations = yield* CancellationService;
    const billingProvider = yield* BillingProviderService;
    const workspaces = yield* WorkspaceAccessService;
    const sql = yield* SqlClient.SqlClient;
    const entitlements = yield* EntitlementPolicy;

    const access = Effect.fn("BillingHandlers.access")(function* (
      workspaceId: string
    ) {
      const auth = yield* CurrentAuth;
      const workspace = yield* workspaces.require({
        workspaceId,
        auth,
        scope: "stats:read",
      });
      return { auth, workspace };
    });
    const billingAccess = Effect.fn("BillingHandlers.billingAccess")(function* (
      workspaceId: string
    ) {
      const resolved = yield* access(workspaceId);
      if (
        resolved.workspace.role !== "owner" &&
        resolved.auth.userId !== resolved.workspace.billingOwnerUserId
      ) {
        return yield* new ForbiddenError({
          message: "Only the workspace owner or current payer can view billing",
        });
      }
      return resolved;
    });
    const payerAccess = Effect.fn("BillingHandlers.payerAccess")(function* (
      workspaceId: string
    ) {
      const resolved = yield* access(workspaceId);
      if (resolved.auth.userId !== resolved.workspace.billingOwnerUserId) {
        return yield* new ForbiddenError({
          message: "Only the current payer can manage cancellation",
        });
      }
      return resolved;
    });

    return handlers
      .handle("subscription", ({ params }) =>
        Effect.gen(function* () {
          const { auth, workspace } = yield* billingAccess(params.workspaceId);
          if (yield* entitlements.isCommunity) {
            return {
              id: `community:${workspace.billingOwnerUserId}`,
              billingOwnerUserId: workspace.billingOwnerUserId,
              plan: "COMMUNITY",
              status: "active",
              currentPeriodStart: null,
              currentPeriodEnd: null,
              addons: {},
              billingInterval: null,
              currency: null,
              recurringAmountMinor: null,
              cancelAtPeriodEnd: false,
              canManageBilling: false,
            };
          }
          const result = yield* billing
            .subscription(workspace.billingOwnerUserId)
            .pipe(Effect.catchTag("NotFoundError", () => Effect.succeed(null)));
          if (result === null) {
            return null;
          }
          return {
            ...result,
            canManageBilling: auth.userId === workspace.billingOwnerUserId,
          };
        })
      )
      .handle("usage", ({ params }) =>
        Effect.gen(function* () {
          const { workspace } = yield* billingAccess(params.workspaceId);
          return yield* billing.usage(workspace.billingOwnerUserId);
        })
      )
      .handle("transactions", ({ params, query }) =>
        Effect.gen(function* () {
          const { workspace } = yield* billingAccess(params.workspaceId);
          return yield* billing.transactions({
            billingOwnerUserId: workspace.billingOwnerUserId,
            ...page(query),
          });
        })
      )
      .handle("portal", ({ params }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { workspace } = yield* payerAccess(params.workspaceId);
          return {
            url: yield* cancellations.portal(workspace.billingOwnerUserId),
          };
        })
      )
      .handle("checkout", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { auth } = yield* payerAccess(params.workspaceId);
          if (
            auth.scopes !== "full" &&
            !auth.scopes.includes("billing:write")
          ) {
            return yield* new ForbiddenError({
              message: "The credential lacks billing delegation",
            });
          }
          const users = yield* sql<{
            email: string | null;
            name: string | null;
          }>`
            SELECT email, name FROM users WHERE id = ${auth.userId}`.pipe(
            Effect.orDie
          );
          if (!users[0]?.email) {
            return yield* new ConflictError({
              message: "An account email is required to start checkout",
              resource: "billing_customer",
            });
          }
          const subscriptions = yield* sql<{
            providerCustomerId: string | null;
          }>`
            SELECT provider_customer_id FROM subscriptions
            WHERE billing_owner_user_id = ${auth.userId}`.pipe(Effect.orDie);
          const returnPath =
            payload.returnPath?.startsWith("/") &&
            !payload.returnPath.startsWith("//")
              ? payload.returnPath
              : undefined;
          return {
            url: yield* billingProvider.checkout({
              customerId: subscriptions[0]?.providerCustomerId ?? undefined,
              email: users[0].email,
              name: users[0].name ?? "Customer",
              billingOwnerUserId: auth.userId,
              plan: payload.plan,
              billingInterval: payload.interval,
              currency: payload.currency,
              returnPath,
              idempotencyKey: payload.idempotencyKey,
            }),
          };
        })
      )
      .handle("transfers", ({ params }) =>
        Effect.gen(function* () {
          const { workspace } = yield* billingAccess(params.workspaceId);
          return yield* transfers.list(workspace.workspaceId);
        })
      )
      .handle("requestTransfer", ({ params, payload }) =>
        Effect.gen(function* () {
          const { auth, workspace } = yield* access(params.workspaceId);
          return yield* transfers.request({
            workspaceId: workspace.workspaceId,
            actorUserId: auth.userId,
            actorRole: workspace.role,
            toUserId: payload.toUserId,
          });
        })
      )
      .handle("acceptTransfer", ({ params }) =>
        Effect.gen(function* () {
          const { auth, workspace } = yield* access(params.workspaceId);
          return yield* transfers.accept({
            workspaceId: workspace.workspaceId,
            transferId: params.id,
            actorUserId: auth.userId,
          });
        })
      )
      .handle("cancelTransfer", ({ params }) =>
        Effect.gen(function* () {
          const { auth, workspace } = yield* access(params.workspaceId);
          return yield* transfers.cancel({
            workspaceId: workspace.workspaceId,
            transferId: params.id,
            actorUserId: auth.userId,
          });
        })
      )
      .handle("cancellation", ({ params }) =>
        Effect.gen(function* () {
          const { auth, workspace } = yield* payerAccess(params.workspaceId);
          const result = yield* cancellations.get(workspace.billingOwnerUserId);
          return {
            ...result,
            canManageCancellation: auth.userId === workspace.billingOwnerUserId,
          };
        })
      )
      .handle("startCancellation", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { workspace } = yield* payerAccess(params.workspaceId);
          return yield* cancellations.start({
            billingOwnerUserId: workspace.billingOwnerUserId,
            reason: payload.reason,
            comment: payload.comment,
          });
        })
      )
      .handle("acceptCancellationOffer", ({ params }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { workspace } = yield* payerAccess(params.workspaceId);
          return yield* cancellations.acceptOffer({
            billingOwnerUserId: workspace.billingOwnerUserId,
            requestId: params.id,
          });
        })
      )
      .handle("scheduleCancellation", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { workspace } = yield* payerAccess(params.workspaceId);
          return yield* cancellations.schedule({
            billingOwnerUserId: workspace.billingOwnerUserId,
            requestId: params.id,
            confirmation: payload.confirmation,
          });
        })
      )
      .handle("reactivateCancellation", ({ params }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { workspace } = yield* payerAccess(params.workspaceId);
          return yield* cancellations.reactivate({
            billingOwnerUserId: workspace.billingOwnerUserId,
            requestId: params.id,
          });
        })
      )
      .handle("abandonCancellation", ({ params }) =>
        Effect.gen(function* () {
          yield* entitlements.requireBillingEnabled;
          const { workspace } = yield* payerAccess(params.workspaceId);
          return yield* cancellations.abandon({
            billingOwnerUserId: workspace.billingOwnerUserId,
            requestId: params.id,
          });
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
