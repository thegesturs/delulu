import { BillingDisabled } from "@delulu/contracts";
import {
  getPlanLimits,
  type PlanType,
  resolvePlanType,
} from "@delulu/payments/plans";
import { Context, Effect, Layer } from "effect";
import { DeploymentConfig } from "./deployment";

export interface EntitlementSnapshot {
  readonly plan: PlanType;
  readonly billingEnabled: boolean;
  readonly subscriptionRequired: boolean;
}

/** Deployment-aware product policy. Authorization and safety limits stay separate. */
export class EntitlementPolicy extends Context.Service<
  EntitlementPolicy,
  {
    readonly snapshot: Effect.Effect<EntitlementSnapshot>;
    readonly isCommunity: Effect.Effect<boolean>;
    readonly requireBillingEnabled: Effect.Effect<void, BillingDisabled>;
    readonly resolvePlan: (stored: string | null | undefined) => PlanType;
    readonly apiRatePerMinute: (stored: string | null | undefined) => number;
  }
>()("@delulu/services/EntitlementPolicy") {
  static readonly layer = Layer.effect(
    EntitlementPolicy,
    Effect.gen(function* () {
      const deployment = yield* DeploymentConfig;
      const community = deployment.mode === "self_hosted";
      return EntitlementPolicy.of({
        snapshot: Effect.succeed({
          plan: community ? "COMMUNITY" : "FREE",
          billingEnabled: !community,
          subscriptionRequired: !community,
        }),
        isCommunity: Effect.succeed(community),
        requireBillingEnabled: community
          ? Effect.fail(
              new BillingDisabled({
                message: "Billing is disabled on this self-hosted instance",
              })
            )
          : Effect.void,
        resolvePlan: (stored) =>
          community ? "COMMUNITY" : resolvePlanType(stored),
        apiRatePerMinute: (stored) =>
          community
            ? deployment.communityApiRatePerMinute
            : getPlanLimits(stored).apiRatePerMinute,
      });
    })
  );
}
