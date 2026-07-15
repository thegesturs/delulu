import { ForbiddenError, NotFoundError } from "@delulu/contracts";
import type {
  AuthContext,
  Scope,
  UserId,
  WorkspaceId,
  WorkspaceRole,
} from "@delulu/core";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { AuthorizationService } from "./authorization";
import { MembershipService } from "./membership";

export interface WorkspaceAccess {
  readonly workspaceId: WorkspaceId;
  readonly memberId: string;
  readonly role: WorkspaceRole;
  readonly billingOwnerUserId: UserId;
  readonly isPersonal: boolean;
  readonly clerkOrgId: string | null;
}

const WorkspaceRow = Schema.Struct({
  id: Schema.String,
  billingOwnerUserId: Schema.String,
  isPersonal: Schema.Boolean,
  clerkOrgId: Schema.NullOr(Schema.String),
});

/** The single workspace path authorization gate used by every M2 service. */
export class WorkspaceAccessService extends Context.Service<
  WorkspaceAccessService,
  {
    readonly require: (input: {
      readonly workspaceId: string;
      readonly auth: AuthContext;
      readonly scope: Scope;
    }) => Effect.Effect<WorkspaceAccess, NotFoundError | ForbiddenError>;
  }
>()("@delulu/services/WorkspaceAccessService") {
  static readonly layer = Layer.effect(
    WorkspaceAccessService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const membership = yield* MembershipService;
      const authorization = yield* AuthorizationService;
      const findWorkspace = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: WorkspaceRow,
        execute: (id) =>
          sql`SELECT id, billing_owner_user_id, is_personal, clerk_org_id
              FROM workspaces WHERE id = ${id} AND deleted_at IS NULL`,
      });

      const require = Effect.fn("WorkspaceAccessService.require")(
        function* (input: {
          readonly workspaceId: string;
          readonly auth: AuthContext;
          readonly scope: Scope;
        }) {
          yield* authorization.enforceWorkspaceBinding(
            input.auth,
            input.workspaceId
          );
          const workspace = yield* findWorkspace(input.workspaceId).pipe(
            Effect.orDie
          );
          if (Option.isNone(workspace)) {
            return yield* new NotFoundError({
              message: "Workspace not found",
              resource: "workspace",
            });
          }
          const member = yield* membership.resolve({
            workspaceId: input.workspaceId,
            userId: input.auth.userId,
          });
          if (Option.isNone(member)) {
            return yield* new ForbiddenError({
              message: "You are not a member of this workspace",
            });
          }
          yield* authorization.requireScope(
            input.auth,
            member.value.role,
            input.scope
          );
          // Connecting an account is part of setup and must remain available
          // before checkout. Product mutations still require paid access.
          if (
            input.scope.endsWith(":write") &&
            input.scope !== "accounts:write"
          ) {
            const subscriptions = yield* sql<{ active: boolean }>`SELECT EXISTS(
              SELECT 1 FROM subscriptions s
              WHERE s.billing_owner_user_id = ${workspace.value.billingOwnerUserId}
                AND s.status IN ('active','trialing')
                AND NOT EXISTS (SELECT 1 FROM cancellation_requests c
                  WHERE c.billing_owner_user_id = s.billing_owner_user_id
                    AND c.status IN ('effective','deleting','deleted'))
            ) AS active`.pipe(Effect.orDie);
            if (!subscriptions[0]?.active) {
              return yield* new ForbiddenError({
                message:
                  "An active subscription is required to modify this workspace",
              });
            }
          }
          return {
            workspaceId: workspace.value.id as WorkspaceId,
            memberId: member.value.memberId,
            role: member.value.role,
            billingOwnerUserId: workspace.value.billingOwnerUserId as UserId,
            isPersonal: workspace.value.isPersonal,
            clerkOrgId: workspace.value.clerkOrgId,
          };
        }
      );
      return WorkspaceAccessService.of({ require });
    })
  );
}
