import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@delulu/contracts";
import type { WorkspaceRole } from "@delulu/core";
import {
  type BillingOwnerTransfer,
  canInitiateBillingTransfer,
} from "@delulu/core/domain/billing";
import { getPlanLimits } from "@delulu/payments/plans";
import { Context, DateTime, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

const transferId = (): string => `billing_transfer_${crypto.randomUUID()}`;
const iso = (value: Date | string): string =>
  DateTime.formatIso(
    typeof value === "string"
      ? DateTime.makeUnsafe(value)
      : DateTime.fromDateUnsafe(value)
  );
const view = (row: Record<string, unknown>): BillingOwnerTransfer => ({
  id: String(row.id),
  workspaceId: String(row.workspaceId),
  fromUserId: String(row.fromUserId),
  toUserId: String(row.toUserId),
  requestedByUserId: String(row.requestedByUserId),
  status: row.status as BillingOwnerTransfer["status"],
  expiresAt: iso(row.expiresAt as Date),
  acceptedAt: row.acceptedAt === null ? null : iso(row.acceptedAt as Date),
  createdAt: iso(row.createdAt as Date),
});

type TransferError = ConflictError | ForbiddenError | NotFoundError;

export class BillingOwnerTransfers extends Context.Service<
  BillingOwnerTransfers,
  {
    readonly list: (
      workspaceId: string
    ) => Effect.Effect<readonly BillingOwnerTransfer[]>;
    readonly request: (input: {
      readonly workspaceId: string;
      readonly actorUserId: string;
      readonly actorRole: WorkspaceRole;
      readonly toUserId: string;
      readonly ttlHours?: number;
    }) => Effect.Effect<BillingOwnerTransfer, TransferError>;
    readonly accept: (input: {
      readonly workspaceId: string;
      readonly transferId: string;
      readonly actorUserId: string;
    }) => Effect.Effect<BillingOwnerTransfer, TransferError>;
    readonly cancel: (input: {
      readonly workspaceId: string;
      readonly transferId: string;
      readonly actorUserId: string;
    }) => Effect.Effect<BillingOwnerTransfer, TransferError>;
  }
>()("@delulu/services/BillingOwnerTransfers") {
  static readonly layer = Layer.effect(
    BillingOwnerTransfers,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const list = Effect.fn("BillingOwnerTransfers.list")(function* (
        workspaceId: string
      ) {
        const rows = yield* sql<Record<string, unknown>>`
          SELECT * FROM billing_owner_transfers WHERE workspace_id = ${workspaceId}
          ORDER BY created_at DESC`.pipe(Effect.orDie);
        return rows.map(view);
      });

      const request = Effect.fn("BillingOwnerTransfers.request")(
        function* (input: {
          readonly workspaceId: string;
          readonly actorUserId: string;
          readonly actorRole: WorkspaceRole;
          readonly toUserId: string;
          readonly ttlHours?: number;
        }) {
          const now = yield* DateTime.now;
          const expiresAt = DateTime.add(now, { hours: input.ttlHours ?? 48 });
          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                const workspaceRows = yield* sql<Record<string, unknown>>`
                SELECT billing_owner_user_id, is_personal FROM workspaces
                WHERE id = ${input.workspaceId} AND deleted_at IS NULL FOR UPDATE`;
                const workspace = workspaceRows[0];
                if (!workspace) {
                  return yield* new NotFoundError({
                    message: "Workspace not found",
                    resource: "workspace",
                  });
                }
                const currentOwner = String(workspace.billingOwnerUserId);
                if (
                  !canInitiateBillingTransfer({
                    actorUserId: input.actorUserId,
                    currentBillingOwnerUserId: currentOwner,
                    actorRole: input.actorRole,
                  })
                ) {
                  return yield* new ForbiddenError({
                    message:
                      "Only a workspace owner or current payer can transfer billing",
                  });
                }
                if (input.toUserId === currentOwner) {
                  return yield* new ConflictError({
                    message: "Target is already the billing owner",
                    resource: "billing_transfer",
                  });
                }
                const target = yield* sql<{ plan: string }>`SELECT s.plan
                FROM workspace_members m
                JOIN subscriptions s ON s.billing_owner_user_id = m.user_id
                WHERE m.workspace_id = ${input.workspaceId}
                  AND m.user_id = ${input.toUserId}
                  AND s.provider_subscription_id IS NOT NULL
                  AND s.status IN ('active', 'trialing')
                  AND upper(s.plan) <> 'FREE'
                LIMIT 1`;
                if (!target[0]) {
                  return yield* new ConflictError({
                    message: "Target must be a member with an active paid plan",
                    resource: "billing_transfer",
                  });
                }
                const backed = yield* sql<{
                  count: string;
                }>`SELECT count(*)::text AS count
                  FROM workspaces WHERE billing_owner_user_id = ${input.toUserId}
                    AND is_personal = false AND deleted_at IS NULL`;
                const organizationLimit = getPlanLimits(
                  target[0].plan
                ).organizations;
                if (
                  !workspace.isPersonal &&
                  organizationLimit !== -1 &&
                  Number(backed[0]?.count ?? 0) >= organizationLimit
                ) {
                  return yield* new ConflictError({
                    message: "Target plan cannot back another workspace",
                    resource: "billing_transfer",
                  });
                }
                yield* sql`UPDATE billing_owner_transfers SET status = 'expired'
                WHERE workspace_id = ${input.workspaceId} AND status = 'pending'
                  AND expires_at <= now()`;
                const pending = yield* sql<{ id: string }>`SELECT id
                FROM billing_owner_transfers WHERE workspace_id = ${input.workspaceId}
                  AND status = 'pending' FOR UPDATE`;
                if (pending[0]) {
                  return yield* new ConflictError({
                    message: "A billing transfer is already pending",
                    resource: "billing_transfer",
                  });
                }
                const rows = yield* sql<
                  Record<string, unknown>
                >`INSERT INTO billing_owner_transfers
                (id, workspace_id, from_user_id, to_user_id, requested_by_user_id, expires_at)
                VALUES (${transferId()}, ${input.workspaceId}, ${currentOwner},
                  ${input.toUserId}, ${input.actorUserId}, ${DateTime.toDateUtc(expiresAt)})
                RETURNING *`;
                return view(rows[0]!);
              })
            )
            .pipe(
              Effect.catchTag("SqlError", (cause) =>
                Effect.die(
                  new Error("Unable to request billing transfer", { cause })
                )
              )
            );
        }
      );

      const accept = Effect.fn("BillingOwnerTransfers.accept")(
        function* (input: {
          readonly workspaceId: string;
          readonly transferId: string;
          readonly actorUserId: string;
        }) {
          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                const workspaceRows = yield* sql<{
                  billingOwnerUserId: string;
                  isPersonal: boolean;
                }>`SELECT billing_owner_user_id, is_personal FROM workspaces
                  WHERE id = ${input.workspaceId} AND deleted_at IS NULL FOR UPDATE`;
                if (!workspaceRows[0]) {
                  return yield* new NotFoundError({
                    message: "Workspace not found",
                    resource: "workspace",
                  });
                }
                const rows = yield* sql<Record<string, unknown>>`SELECT *
                FROM billing_owner_transfers
                WHERE id = ${input.transferId} AND workspace_id = ${input.workspaceId}
                FOR UPDATE`;
                const transfer = rows[0];
                if (!transfer) {
                  return yield* new NotFoundError({
                    message: "Billing transfer not found",
                    resource: "billing_transfer",
                  });
                }
                if (transfer.toUserId !== input.actorUserId) {
                  return yield* new ForbiddenError({
                    message: "Only the target billing owner can accept",
                  });
                }
                if (transfer.status !== "pending") {
                  return yield* new ConflictError({
                    message: `Billing transfer is ${String(transfer.status)}`,
                    resource: "billing_transfer",
                  });
                }
                const current = yield* DateTime.now;
                if (
                  DateTime.toEpochMillis(
                    DateTime.fromDateUnsafe(transfer.expiresAt as Date)
                  ) <= DateTime.toEpochMillis(current)
                ) {
                  yield* sql`UPDATE billing_owner_transfers SET status = 'expired'
                  WHERE id = ${input.transferId}`;
                  return yield* new ConflictError({
                    message: "Billing transfer has expired",
                    resource: "billing_transfer",
                  });
                }
                const eligible = yield* sql<{ plan: string }>`SELECT s.plan
                FROM workspace_members m
                JOIN subscriptions s ON s.billing_owner_user_id = m.user_id
                WHERE m.workspace_id = ${input.workspaceId}
                  AND m.user_id = ${input.actorUserId}
                  AND s.provider_subscription_id IS NOT NULL
                  AND s.status IN ('active', 'trialing')
                  AND upper(s.plan) <> 'FREE'
                LIMIT 1`;
                if (!eligible[0]) {
                  return yield* new ConflictError({
                    message:
                      "Target membership or paid plan is no longer active",
                    resource: "billing_transfer",
                  });
                }
                const backed = yield* sql<{
                  count: string;
                }>`SELECT count(*)::text AS count
                  FROM workspaces WHERE billing_owner_user_id = ${input.actorUserId}
                    AND is_personal = false AND deleted_at IS NULL`;
                const organizationLimit = getPlanLimits(
                  eligible[0].plan
                ).organizations;
                if (
                  !workspaceRows[0].isPersonal &&
                  organizationLimit !== -1 &&
                  Number(backed[0]?.count ?? 0) >= organizationLimit
                ) {
                  return yield* new ConflictError({
                    message: "Target plan cannot back another workspace",
                    resource: "billing_transfer",
                  });
                }
                const changed = yield* sql<{ id: string }>`UPDATE workspaces
                SET billing_owner_user_id = ${input.actorUserId}
                WHERE id = ${input.workspaceId}
                  AND billing_owner_user_id = ${String(transfer.fromUserId)}
                RETURNING id`;
                if (!changed[0]) {
                  return yield* new ConflictError({
                    message: "Workspace billing owner changed concurrently",
                    resource: "billing_transfer",
                  });
                }
                const accepted = yield* sql<Record<string, unknown>>`
                UPDATE billing_owner_transfers SET status = 'accepted', accepted_at = now()
                WHERE id = ${input.transferId} RETURNING *`;
                return view(accepted[0]!);
              })
            )
            .pipe(
              Effect.catchTag("SqlError", (cause) =>
                Effect.die(
                  new Error("Unable to accept billing transfer", { cause })
                )
              )
            );
        }
      );

      const cancel = Effect.fn("BillingOwnerTransfers.cancel")(
        function* (input: {
          readonly workspaceId: string;
          readonly transferId: string;
          readonly actorUserId: string;
        }) {
          const rows = yield* sql<
            Record<string, unknown>
          >`UPDATE billing_owner_transfers t
            SET status = 'cancelled', cancelled_at = now()
            FROM workspaces w
            WHERE t.id = ${input.transferId} AND t.workspace_id = ${input.workspaceId}
              AND w.id = t.workspace_id AND t.status = 'pending'
              AND (${input.actorUserId} IN (t.requested_by_user_id, t.from_user_id, t.to_user_id)
                OR ${input.actorUserId} = w.billing_owner_user_id)
            RETURNING t.*`.pipe(Effect.orDie);
          if (!rows[0]) {
            return yield* new ConflictError({
              message:
                "Pending billing transfer not found or cannot be cancelled",
              resource: "billing_transfer",
            });
          }
          return view(rows[0]);
        }
      );

      return BillingOwnerTransfers.of({ list, request, accept, cancel });
    })
  );
}
