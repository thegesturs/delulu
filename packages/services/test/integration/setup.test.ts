import { ConflictError } from "@delulu/contracts";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { describe, expect, it } from "vitest";
import { ClerkAdminService } from "../../src/clerk-admin";
import { DeploymentConfig } from "../../src/deployment";
import { EntitlementPolicy } from "../../src/entitlements";
import { IdentityService } from "../../src/identity";
import { SetupService } from "../../src/setup";
import { provisionPaidSubscription } from "./paid-subscription";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const Deployment = DeploymentConfig.layer({
  mode: "hosted",
  publishTransport: "postgres",
  registrationEnabled: true,
  version: "test",
  communityApiRatePerMinute: 120,
});
const Entitlements = EntitlementPolicy.layer.pipe(Layer.provide(Deployment));

describe("SetupService", () => {
  it("persists completion and requires its metadata mirror before succeeding", async () => {
    let metadataAvailable = false;
    const ClerkAdmin = Layer.succeed(
      ClerkAdminService,
      ClerkAdminService.of({
        invite: () => Effect.succeed({ id: "invitation_test" }),
        updateMembership: () => Effect.void,
        removeMembership: () => Effect.void,
        updateUserPublicMetadata: () =>
          metadataAvailable
            ? Effect.void
            : Effect.fail(
                new ConflictError({
                  message: "Identity metadata is unavailable",
                  resource: "user_metadata",
                })
              ),
      })
    );
    const Setup = SetupService.layer.pipe(
      Layer.provide([ClerkAdmin, Entitlements])
    );
    const AppLayer = Layer.mergeAll(IdentityService.layer, Setup).pipe(
      Layer.provideMerge(Pg)
    );
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const setup = yield* SetupService;
      const sql = yield* SqlClient.SqlClient;
      const resolved = yield* identity.resolve({
        sub: `setup_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace!.id;
      yield* setup.updateGoal({ userId: resolved.user.id, goal: "publish" });
      yield* setup.updateOptionalSteps({
        userId: resolved.user.id,
        optionalSteps: { ready: "completed" },
      });
      yield* setup.updateGoal({ userId: resolved.user.id, goal: "auto_dm" });
      const switchedGoal = yield* setup.status(workspaceId, resolved.user.id);
      yield* setup.updateGoal({ userId: resolved.user.id, goal: "publish" });
      yield* sql`INSERT INTO connections
        (id, workspace_id, platform, profile_id, access_token, cipher_version)
        VALUES (${`connection_${crypto.randomUUID()}`}, ${workspaceId},
          'THREADS', ${`profile_${crypto.randomUUID()}`}, 'opaque', 'v1')`;
      const resetReady = yield* setup.status(workspaceId, resolved.user.id);
      yield* setup.updateOptionalSteps({
        userId: resolved.user.id,
        optionalSteps: { ready: "completed" },
      });

      const unpaid = yield* setup
        .complete(workspaceId, resolved.user.id)
        .pipe(Effect.exit);
      yield* provisionPaidSubscription(resolved.user.id);
      const unavailable = yield* setup
        .complete(workspaceId, resolved.user.id)
        .pipe(Effect.exit);
      metadataAvailable = true;
      yield* setup.complete(workspaceId, resolved.user.id);
      const status = yield* setup.status(workspaceId, resolved.user.id);

      return { resetReady, switchedGoal, unpaid, unavailable, status };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.unpaid._tag).toBe("Failure");
    expect(result.unavailable._tag).toBe("Failure");
    expect(result.switchedGoal.webStep).toBe("connect");
    expect(result.resetReady.webStep).toBe("ready");
    expect(result.status.onboardingComplete).toBe(true);
    expect(result.status.subscription).toEqual({
      plan: "ECHO",
      status: "active",
      paid: true,
    });
  });
});
