import type { ClerkWebhookPayload } from "@delulu/contracts";
import type { WorkspaceRole } from "@delulu/core/domain/workspace-member";
import { MemberId, makeId, WorkspaceId } from "@delulu/core/kernel/ids";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { IdentityService } from "./identity";

export class ClerkSyncError extends Schema.TaggedErrorClass<ClerkSyncError>()(
  "ClerkSyncError",
  {
    eventType: Schema.String,
    message: Schema.String,
    retryable: Schema.Boolean,
  }
) {}

export type ClerkSyncEvent = typeof ClerkWebhookPayload.Type;

const syncError = (eventType: string, message: string) =>
  new ClerkSyncError({ eventType, message, retryable: true });

const CLERK_ROLE_PREFIX = /^org:/;
const roleFromClerk = (role: string): WorkspaceRole | null => {
  switch (role.replace(CLERK_ROLE_PREFIX, "")) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "viewer":
      return "viewer";
    case "editor":
      return "editor";
    default:
      return null;
  }
};

export class ClerkSyncService extends Context.Service<
  ClerkSyncService,
  {
    readonly sync: (
      event: ClerkSyncEvent
    ) => Effect.Effect<void, ClerkSyncError>;
  }
>()("@delulu/services/ClerkSyncService") {
  static readonly layer = Layer.effect(
    ClerkSyncService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const identities = yield* IdentityService;
      const execute = <A, E>(eventType: string, effect: Effect.Effect<A, E>) =>
        effect.pipe(
          Effect.mapError(() =>
            syncError(eventType, "Identity synchronization failed")
          )
        );

      const sync = Effect.fn("ClerkSyncService.sync")(function* (
        event: ClerkSyncEvent
      ) {
        switch (event.type) {
          case "user.created":
          case "user.updated": {
            const name =
              [event.data.first_name, event.data.last_name]
                .filter(Boolean)
                .join(" ") || null;
            const email =
              event.data.email_addresses?.[0]?.email_address ?? null;
            const resolved = yield* execute(
              event.type,
              identities.resolve({
                sub: event.data.id,
                email,
                name,
                imageUrl: event.data.image_url ?? null,
              })
            );
            yield* execute(
              event.type,
              sql`UPDATE users SET email = ${email}, name = ${name}, image_url = ${event.data.image_url ?? null}, identity_deleted_at = NULL WHERE id = ${resolved.user.id}`
            );
            return;
          }
          case "user.deleted":
            yield* execute(
              event.type,
              sql`UPDATE users SET identity_deleted_at = now(), email = NULL, image_url = NULL WHERE external_id = ${event.data.id}`
            );
            return;
          case "organization.created":
          case "organization.updated": {
            const existing = yield* execute(
              event.type,
              sql<{
                id: string;
              }>`SELECT id FROM workspaces WHERE clerk_org_id = ${event.data.id}`
            );
            if (existing[0]) {
              yield* execute(
                event.type,
                sql`UPDATE workspaces SET name = ${event.data.name}, slug = ${event.data.slug ?? null}, deleted_at = NULL WHERE id = ${existing[0].id}`
              );
              return;
            }
            if (!event.data.created_by) {
              return yield* syncError(
                event.type,
                "Organization creator is missing"
              );
            }
            const creator = yield* execute(
              event.type,
              sql<{
                id: string;
              }>`SELECT id FROM users WHERE external_id = ${event.data.created_by}`
            );
            if (!creator[0]) {
              return yield* syncError(
                event.type,
                "Organization creator is not provisioned yet"
              );
            }
            yield* execute(
              event.type,
              sql`INSERT INTO workspaces (id, name, slug, billing_owner_user_id, parent_org_id, clerk_org_id, is_personal) VALUES (${makeId(WorkspaceId)}, ${event.data.name}, ${event.data.slug ?? null}, ${creator[0].id}, NULL, ${event.data.id}, false) ON CONFLICT (clerk_org_id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, deleted_at = NULL`
            );
            return;
          }
          case "organization.deleted":
            yield* execute(
              event.type,
              sql`UPDATE workspaces SET deleted_at = now() WHERE clerk_org_id = ${event.data.id}`
            );
            return;
          case "organizationMembership.created":
          case "organizationMembership.updated":
          case "organizationMembership.deleted": {
            const workspace = yield* execute(
              event.type,
              sql<{
                id: string;
              }>`SELECT id FROM workspaces WHERE clerk_org_id = ${event.data.organization.id}`
            );
            const user = yield* execute(
              event.type,
              sql<{
                id: string;
              }>`SELECT id FROM users WHERE external_id = ${event.data.public_user_data.user_id}`
            );
            if (!(workspace[0] && user[0])) {
              return yield* syncError(
                event.type,
                "Membership dependencies are not provisioned yet"
              );
            }
            if (event.type === "organizationMembership.deleted") {
              yield* execute(
                event.type,
                sql`DELETE FROM workspace_members WHERE workspace_id = ${workspace[0].id} AND user_id = ${user[0].id}`
              );
              return;
            }
            const role = roleFromClerk(event.data.role);
            if (role === null) {
              return yield* new ClerkSyncError({
                eventType: event.type,
                message: "Unsupported Clerk organization role",
                retryable: false,
              });
            }
            yield* execute(
              event.type,
              sql`INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (${makeId(MemberId)}, ${workspace[0].id}, ${user[0].id}, ${role}) ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role`
            );
            return;
          }
          default:
            return;
        }
      });
      return ClerkSyncService.of({ sync });
    })
  );
}
