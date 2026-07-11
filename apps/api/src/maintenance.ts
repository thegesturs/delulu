import { AutomationKvRepairJob, BillingReconciliation } from "@delulu/services";
import { Effect, type Layer } from "effect";
import type { AppServices } from "./app";

/** Bounded, replay-safe maintenance invoked by the staging Worker cron. */
export const runMaintenance = (
  layer: Layer.Layer<AppServices>
): Promise<void> =>
  Effect.gen(function* () {
    const billing = yield* BillingReconciliation;
    const automationKv = yield* AutomationKvRepairJob;
    yield* billing.run();
    yield* automationKv.runBatch(0, 200);
  }).pipe(Effect.provide(layer), Effect.runPromise);
