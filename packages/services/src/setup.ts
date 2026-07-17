import type { UserId, WorkspaceId } from "@delulu/core";
import { isPaidPlan, PAID_PLAN_TYPES } from "@delulu/payments/plans";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { ClerkAdminService } from "./clerk-admin";

export type OptionalSetupStepState = "completed" | "skipped";

export interface SetupStatus {
  readonly workspaceId: string;
  readonly connectedPlatforms: readonly string[];
  readonly subscription: {
    readonly plan: string;
    readonly status: string;
    readonly paid: boolean;
  };
  readonly optionalSteps: Readonly<Record<string, string>>;
  readonly outstandingAction: "connect_account" | "complete_payment" | null;
  readonly onboardingComplete: boolean;
}

export class SetupService extends Context.Service<
  SetupService,
  {
    readonly status: (
      workspaceId: WorkspaceId,
      userId: UserId
    ) => Effect.Effect<SetupStatus>;
    readonly updateOptionalSteps: (input: {
      readonly userId: UserId;
      readonly optionalSteps: Readonly<Record<string, OptionalSetupStepState>>;
    }) => Effect.Effect<void>;
  }
>()("@delulu/services/SetupService") {
  static readonly layer = Layer.effect(
    SetupService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const clerk = yield* ClerkAdminService;

      const status = Effect.fn("SetupService.status")(function* (
        workspaceId: WorkspaceId,
        userId: UserId
      ) {
        const [connections, subscriptions, users] = yield* Effect.all([
          sql<{ platform: string }>`SELECT DISTINCT platform FROM connections
            WHERE workspace_id = ${workspaceId} ORDER BY platform`,
          sql<{ plan: string; status: string }>`SELECT s.plan, s.status
            FROM workspaces w JOIN subscriptions s
              ON s.billing_owner_user_id = w.billing_owner_user_id
            WHERE w.id = ${workspaceId}`,
          sql<{
            externalId: string;
            onboardingOptional: Record<string, string>;
            onboardingCompletedAt: Date | null;
            onboardingMetadataSyncedAt: Date | null;
          }>`SELECT external_id, onboarding_optional, onboarding_completed_at
              , onboarding_metadata_synced_at
            FROM users WHERE id = ${userId}`,
        ]).pipe(Effect.orDie);
        const subscription = subscriptions[0] ?? {
          plan: "free",
          status: "inactive",
        };
        const paid =
          isPaidPlan(subscription.plan) &&
          subscription.status.toUpperCase() === "ACTIVE";
        const connectedPlatforms = connections.map((row) => row.platform);
        const onboardingComplete = connectedPlatforms.length > 0 && paid;
        const user = users[0];
        const aggregate = yield* sql<{ complete: boolean }>`SELECT EXISTS(
          SELECT 1 FROM workspace_members wm
          JOIN workspaces w ON w.id = wm.workspace_id
          WHERE wm.user_id = ${userId} AND w.deleted_at IS NULL
            AND EXISTS (SELECT 1 FROM connections c
              WHERE c.workspace_id = w.id)
            AND EXISTS (SELECT 1 FROM subscriptions s
              WHERE s.billing_owner_user_id = w.billing_owner_user_id
                AND upper(s.plan) IN ${sql.in(PAID_PLAN_TYPES)}
                AND upper(s.status) = 'ACTIVE')
        ) AS complete`.pipe(Effect.orDie);
        const userOnboardingComplete = aggregate[0]?.complete ?? false;
        if (
          user &&
          (userOnboardingComplete !== Boolean(user.onboardingCompletedAt) ||
            user.onboardingMetadataSyncedAt === null)
        ) {
          yield* sql`UPDATE users SET onboarding_completed_at =
            ${userOnboardingComplete ? new Date() : null},
            onboarding_metadata_synced_at = NULL WHERE id = ${userId}`.pipe(
            Effect.orDie
          );
          const sync = yield* clerk
            .updateUserPublicMetadata({
              externalUserId: user.externalId,
              metadata: {
                onboardingComplete: userOnboardingComplete,
                onboardingSource: "agent_or_web",
                completedAt: userOnboardingComplete ? Date.now() : null,
              },
            })
            .pipe(Effect.result);
          if (sync._tag === "Success") {
            yield* sql`UPDATE users SET onboarding_metadata_synced_at = now()
              WHERE id = ${userId}`.pipe(Effect.orDie);
          }
        }
        return {
          workspaceId,
          connectedPlatforms,
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            paid,
          },
          optionalSteps: user?.onboardingOptional ?? {},
          outstandingAction:
            connectedPlatforms.length === 0
              ? ("connect_account" as const)
              : paid
                ? null
                : ("complete_payment" as const),
          onboardingComplete,
        };
      });

      const updateOptionalSteps = Effect.fn("SetupService.updateOptionalSteps")(
        function* (input: {
          userId: UserId;
          optionalSteps: Readonly<Record<string, OptionalSetupStepState>>;
        }) {
          yield* sql`UPDATE users SET onboarding_optional =
          onboarding_optional || ${JSON.stringify(input.optionalSteps)}::jsonb
          WHERE id = ${input.userId}`.pipe(Effect.orDie);
        }
      );

      return SetupService.of({ status, updateOptionalSteps });
    })
  );
}
