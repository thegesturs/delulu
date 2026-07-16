import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { DeploymentConfig } from "./deployment";
import { EntitlementPolicy } from "./entitlements";

const snapshot = (mode: "hosted" | "self_hosted") =>
  Effect.runPromise(
    Effect.gen(function* () {
      const policy = yield* EntitlementPolicy;
      return {
        snapshot: yield* policy.snapshot,
        billing: yield* Effect.result(policy.requireBillingEnabled),
      };
    }).pipe(
      Effect.provide(EntitlementPolicy.layer),
      Effect.provide(
        DeploymentConfig.layer({
          mode,
          publishTransport: mode === "hosted" ? "sqs" : "postgres",
          registrationEnabled: true,
          version: "test",
          communityApiRatePerMinute: 240,
        })
      )
    )
  );

describe("EntitlementPolicy", () => {
  it("keeps subscriptions enabled for hosted deployments", async () => {
    await expect(snapshot("hosted")).resolves.toMatchObject({
      snapshot: {
        plan: "FREE",
        billingEnabled: true,
        subscriptionRequired: true,
      },
      billing: { _tag: "Success" },
    });
  });

  it("unlocks Community without enabling billing for self-hosted deployments", async () => {
    await expect(snapshot("self_hosted")).resolves.toMatchObject({
      snapshot: {
        plan: "COMMUNITY",
        billingEnabled: false,
        subscriptionRequired: false,
      },
      billing: { _tag: "Failure", failure: { _tag: "BillingDisabled" } },
    });
  });
});
