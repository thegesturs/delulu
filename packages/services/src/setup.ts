import type { ConflictError } from "@delulu/contracts";
import type { UserId, WorkspaceId } from "@delulu/core";
import { isPaidPlan } from "@delulu/payments/plans";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { ClerkAdminService } from "./clerk-admin";
import { EntitlementPolicy } from "./entitlements";

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
    readonly complete: (userId: UserId) => Effect.Effect<void, ConflictError>;
  }
>()("@delulu/services/SetupService") {
  static readonly layer = Layer.effect(
    SetupService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const clerk = yield* ClerkAdminService;
      const entitlements = yield* EntitlementPolicy;

      const syncCompletionMetadata = Effect.fn(
        "SetupService.syncCompletionMetadata"
      )(function* (input: { userId: UserId; externalId: string }) {
        yield* clerk.updateUserPublicMetadata({
          externalUserId: input.externalId,
          metadata: {
            onboardingComplete: true,
            onboardingSource: "agent_or_web",
            completedAt: Date.now(),
          },
        });
        yield* sql`UPDATE users SET onboarding_metadata_synced_at = now()
          WHERE id = ${input.userId}`.pipe(Effect.orDie);
      });

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
        const community = yield* entitlements.isCommunity;
        const subscription = community
          ? {
              plan: "COMMUNITY",
              status: "active",
            }
          : (subscriptions[0] ?? {
              plan: "free",
              status: "inactive",
            });
        const paid =
          isPaidPlan(subscription.plan) &&
          subscription.status.toUpperCase() === "ACTIVE";
        const connectedPlatforms = connections.map((row) => row.platform);
        const user = users[0];
        const onboardingComplete = Boolean(user?.onboardingCompletedAt);
        if (
          user &&
          onboardingComplete &&
          user.onboardingMetadataSyncedAt === null
        ) {
          yield* syncCompletionMetadata({
            userId,
            externalId: user.externalId,
          }).pipe(Effect.result);
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

      const complete = Effect.fn("SetupService.complete")(function* (
        userId: UserId
      ) {
        const users = yield* sql<{ externalId: string }>`
          UPDATE users SET
            onboarding_completed_at = COALESCE(onboarding_completed_at, now()),
            onboarding_metadata_synced_at = NULL
          WHERE id = ${userId}
          RETURNING external_id`.pipe(Effect.orDie);
        const user = users[0];
        if (!user) {
          return yield* Effect.die("Authenticated user is not provisioned");
        }
        yield* syncCompletionMetadata({
          userId,
          externalId: user.externalId,
        });
      });

      return SetupService.of({ status, updateOptionalSteps, complete });
    })
  );
}
