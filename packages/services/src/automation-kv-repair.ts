import { Context, Effect, Layer } from "effect";
import { AutomationService } from "./automations";

export interface AutomationKvRepairResult {
  readonly repaired: number;
  readonly nextOffset: number | null;
}

/** Cron-callable bounded repair pass; Postgres remains the source of truth. */
export class AutomationKvRepairJob extends Context.Service<
  AutomationKvRepairJob,
  {
    readonly runBatch: (
      offset: number,
      batchSize?: number
    ) => Effect.Effect<
      AutomationKvRepairResult,
      import("@delulu/core/domain/automation").AutomationPersistenceError
    >;
  }
>()("@delulu/services/AutomationKvRepairJob") {
  static readonly layer = Layer.effect(
    AutomationKvRepairJob,
    Effect.gen(function* () {
      const automations = yield* AutomationService;
      const runBatch = Effect.fn("AutomationKvRepairJob.runBatch")(function* (
        offset: number,
        batchSize = 200
      ) {
        const repaired = yield* automations.repairTriggerCache(
          Math.min(500, Math.max(1, batchSize)),
          Math.max(0, offset)
        );
        return {
          repaired,
          nextOffset: repaired < batchSize ? null : offset + repaired,
        };
      });
      return AutomationKvRepairJob.of({ runBatch });
    })
  );
}
