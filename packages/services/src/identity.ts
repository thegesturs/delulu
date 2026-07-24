import {
  MemberId,
  makeId,
  makeUserRepository,
  makeWorkspaceMemberRepository,
  makeWorkspaceRepository,
  User,
  UserId,
  Workspace,
  WorkspaceId,
  WorkspaceMember,
} from "@delulu/core";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { isUniqueViolation } from "./sql-errors";

export interface ClerkProfile {
  readonly sub: string;
  readonly email?: string | null;
  readonly name?: string | null;
  readonly imageUrl?: string | null;
}

export interface ResolvedIdentity {
  readonly user: User;
  readonly personalWorkspace: Workspace | null;
}

/**
 * Resolves a Clerk `sub` to our `users` row, provisioning the user + their
 * personal workspace on first sight (JIT). A paid subscription is created only
 * by the verified billing webhook; there is no free fallback entitlement.
 * keyed on `external_id`, so it is safe under the webhook-lag window post-cutover
 * and makes local dev work end-to-end without seeding.
 */
export class IdentityService extends Context.Service<
  IdentityService,
  {
    readonly getByExternalId: (
      externalId: string
    ) => Effect.Effect<Option.Option<User>>;
    readonly resolve: (
      profile: ClerkProfile
    ) => Effect.Effect<ResolvedIdentity>;
    /** Load an already-provisioned identity by user id (dies if absent). */
    readonly resolveById: (userId: string) => Effect.Effect<ResolvedIdentity>;
    /** Restore the invariant that a personal workspace owner is an owner member. */
    readonly ensurePersonalWorkspaceOwnership: (
      userId: string
    ) => Effect.Effect<void>;
  }
>()("@delulu/services/IdentityService") {
  static readonly layer = Layer.effect(
    IdentityService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const userRepo = yield* makeUserRepository();
      const workspaceRepo = yield* makeWorkspaceRepository();
      const memberRepo = yield* makeWorkspaceMemberRepository();

      const findUser = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: User,
        execute: (externalId) =>
          sql`SELECT * FROM users WHERE external_id = ${externalId}`,
      });

      const findUserById = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: User,
        execute: (userId) => sql`SELECT * FROM users WHERE id = ${userId}`,
      });

      const findPersonalWorkspace = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: Workspace,
        execute: (userId) =>
          sql`SELECT * FROM workspaces WHERE billing_owner_user_id = ${userId} AND is_personal = true ORDER BY created_at LIMIT 1`,
      });

      const getByExternalId = (externalId: string) =>
        findUser(externalId).pipe(Effect.orDie);

      const loadResolved = (user: User): Effect.Effect<ResolvedIdentity> =>
        findPersonalWorkspace(user.id).pipe(
          Effect.map((workspace) => ({
            user,
            personalWorkspace: Option.getOrNull(workspace),
          })),
          Effect.orDie
        );

      const ensurePersonalWorkspaceOwnership = Effect.fn(
        "IdentityService.ensurePersonalWorkspaceOwnership"
      )(function* (userId: string) {
        const ownership = yield* sql<{
          hasWorkspace: boolean;
          needsRepair: boolean;
        }>`SELECT
          EXISTS (
            SELECT 1
            FROM workspaces
            WHERE billing_owner_user_id = ${userId}
              AND is_personal = true
              AND deleted_at IS NULL
          ) AS "hasWorkspace",
          EXISTS (
            SELECT 1
            FROM workspaces workspace
            LEFT JOIN workspace_members member
              ON member.workspace_id = workspace.id
              AND member.user_id = ${userId}
            WHERE workspace.billing_owner_user_id = ${userId}
              AND workspace.is_personal = true
              AND workspace.deleted_at IS NULL
              AND (member.id IS NULL OR member.role <> 'owner')
          ) AS "needsRepair"`.pipe(Effect.orDie);
        if (ownership[0]?.hasWorkspace && !ownership[0].needsRepair) {
          return;
        }
        yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
              const personalWorkspaces = yield* sql<{
                id: string;
              }>`SELECT id FROM workspaces
                WHERE billing_owner_user_id = ${userId}
                  AND is_personal = true
                  AND deleted_at IS NULL`;
              if (personalWorkspaces.length === 0) {
                yield* sql`INSERT INTO workspaces
                  (id, name, billing_owner_user_id, is_personal)
                  VALUES (${makeId(WorkspaceId)}, 'Personal', ${userId}, true)`;
              }
              yield* sql`INSERT INTO workspace_members
                (id, workspace_id, user_id, role)
                SELECT
                  'member_' || substr(
                    replace(gen_random_uuid()::text, '-', ''),
                    1,
                    12
                  ),
                  id,
                  ${userId},
                  'owner'
                FROM workspaces
                WHERE billing_owner_user_id = ${userId}
                  AND is_personal = true
                  AND deleted_at IS NULL
                ON CONFLICT (workspace_id, user_id)
                DO UPDATE SET role = 'owner', updated_at = now()
                WHERE workspace_members.role <> 'owner'`;
            })
          )
          .pipe(Effect.orDie);
      });

      const repairAndLoadResolved = (user: User) =>
        ensurePersonalWorkspaceOwnership(user.id).pipe(
          Effect.andThen(loadResolved(user))
        );

      const provision = (
        profile: ClerkProfile
      ): Effect.Effect<ResolvedIdentity> =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              const user = yield* userRepo.insert(
                User.insert.make({
                  id: makeId(UserId),
                  legacyConvexId: null,
                  externalId: profile.sub,
                  email: profile.email ?? null,
                  name: profile.name ?? null,
                  imageUrl: profile.imageUrl ?? null,
                  monthlyPosts: 0n,
                  monthlyPostsPeriodStart: null,
                  dmsSent: 0n,
                  dmsSentPeriodStart: null,
                  transcriptionsUsed: 0n,
                  transcriptionsPeriodStart: null,
                })
              );
              const workspace = yield* workspaceRepo.insert(
                Workspace.insert.make({
                  id: makeId(WorkspaceId),
                  legacyConvexId: null,
                  name: "Personal",
                  slug: null,
                  billingOwnerUserId: user.id,
                  parentOrgId: null,
                  clerkOrgId: null,
                  isPersonal: true,
                  deletedAt: null,
                })
              );
              yield* memberRepo.insert(
                WorkspaceMember.insert.make({
                  id: makeId(MemberId),
                  legacyConvexId: null,
                  workspaceId: workspace.id,
                  userId: user.id,
                  role: "owner",
                })
              );
              return {
                user,
                personalWorkspace: workspace,
              } satisfies ResolvedIdentity;
            })
          )
          .pipe(
            // A concurrent provisioner won the race — fall back to a fresh read.
            Effect.catchIf(isUniqueViolation, () =>
              findUser(profile.sub).pipe(
                Effect.flatMap(
                  Option.match({
                    onNone: () =>
                      Effect.die("provisioning raced without a winner"),
                    onSome: repairAndLoadResolved,
                  })
                )
              )
            ),
            Effect.orDie
          );

      const resolve = (profile: ClerkProfile) =>
        findUser(profile.sub).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => provision(profile),
              onSome: repairAndLoadResolved,
            })
          ),
          Effect.orDie
        );

      const resolveById = (userId: string) =>
        findUserById(userId).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.die(`user ${userId} not found`),
              onSome: repairAndLoadResolved,
            })
          ),
          Effect.orDie
        );

      return IdentityService.of({
        getByExternalId,
        resolve,
        resolveById,
        ensurePersonalWorkspaceOwnership,
      });
    })
  );
}
