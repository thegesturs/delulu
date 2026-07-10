import {
  MemberId,
  makeId,
  makeSubscriptionRepository,
  makeUserRepository,
  makeWorkspaceMemberRepository,
  makeWorkspaceRepository,
  Subscription,
  SubscriptionId,
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
 * personal workspace + a free subscription on first sight (JIT). Idempotent and
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
  }
>()("@delulu/services/IdentityService") {
  static readonly layer = Layer.effect(
    IdentityService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const userRepo = yield* makeUserRepository();
      const workspaceRepo = yield* makeWorkspaceRepository();
      const memberRepo = yield* makeWorkspaceMemberRepository();
      const subscriptionRepo = yield* makeSubscriptionRepository();

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
              yield* subscriptionRepo.insert(
                Subscription.insert.make({
                  id: makeId(SubscriptionId),
                  legacyConvexId: null,
                  billingOwnerUserId: user.id,
                  providerCustomerId: null,
                  providerSubscriptionId: null,
                  plan: "free",
                  status: "active",
                  currentPeriodStart: null,
                  currentPeriodEnd: null,
                  monthlyPosts: 0n,
                  mediaStorageBytes: 0n,
                  dmsSent: 0n,
                  dmsSkipped: 0n,
                  transcriptionsUsed: 0n,
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
                    onSome: loadResolved,
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
              onSome: loadResolved,
            })
          ),
          Effect.orDie
        );

      const resolveById = (userId: string) =>
        findUserById(userId).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.die(`user ${userId} not found`),
              onSome: loadResolved,
            })
          ),
          Effect.orDie
        );

      return IdentityService.of({ getByExternalId, resolve, resolveById });
    })
  );
}
