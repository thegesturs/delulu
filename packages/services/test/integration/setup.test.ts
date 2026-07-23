import { ConflictError } from "@delulu/contracts";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import { ClerkAdminService } from "../../src/clerk-admin";
import { DeploymentConfig } from "../../src/deployment";
import { EntitlementPolicy } from "../../src/entitlements";
import { IdentityService } from "../../src/identity";
import { SetupService } from "../../src/setup";

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
      const resolved = yield* identity.resolve({
        sub: `setup_${crypto.randomUUID()}`,
      });
      const workspaceId = resolved.personalWorkspace!.id;

      const unavailable = yield* setup
        .complete(resolved.user.id)
        .pipe(Effect.exit);
      metadataAvailable = true;
      yield* setup.complete(resolved.user.id);
      const status = yield* setup.status(workspaceId, resolved.user.id);

      return { unavailable, status };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.unavailable._tag).toBe("Failure");
    expect(result.status.onboardingComplete).toBe(true);
    expect(result.status.subscription).toEqual({
      plan: "free",
      status: "inactive",
      paid: false,
    });
  });
});
