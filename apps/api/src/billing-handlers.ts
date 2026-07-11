import { ForbiddenError } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import { Effect, Layer } from "effect";
import { HttpApi, HttpApiBuilder } from "effect/unstable/httpapi";
import { BillingGroup } from "../../../packages/contracts/src/billing";
import { BillingService } from "../../../packages/services/src/billing";
import { BillingOwnerTransfers } from "../../../packages/services/src/billing-transfer";
import { WorkspaceAccessService } from "../../../packages/services/src/workspace-access";
import { AuthenticationLive } from "./auth-middleware";

/** Standalone lane API; shared assembly should add BillingGroup to Api. */
export const BillingApi = HttpApi.make("billingApi").add(BillingGroup);

const page = (query: {
  readonly limit?: number;
  readonly offset?: number;
}) => ({
  limit: Math.min(100, Math.max(1, query.limit ?? 20)),
  offset: Math.max(0, query.offset ?? 0),
});

export const BillingHandlers = HttpApiBuilder.group(
  BillingApi,
  "billing",
  Effect.fnUntraced(function* (handlers) {
    const billing = yield* BillingService;
    const transfers = yield* BillingOwnerTransfers;
    const workspaces = yield* WorkspaceAccessService;

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

    return handlers
      .handle("subscription", ({ params }) =>
        Effect.gen(function* () {
          const { workspace } = yield* billingAccess(params.workspaceId);
          return yield* billing.subscription(workspace.billingOwnerUserId);
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
      );
  })
).pipe(Layer.provide(AuthenticationLive));
