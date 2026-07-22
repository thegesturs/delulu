import {
  AutomationKvRepairJob,
  BillingReconciliation,
  CancellationService,
  LifecycleService,
  MessagingService,
} from "@delulu/services";
import { Effect, type Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import type { AppServices } from "./app";

const AUTOMATION_KV_BATCH_SIZE = 200;
const MAX_AUTOMATION_KV_BATCHES = 10;

/** Bounded, replay-safe maintenance invoked by the Worker cron. */
const maintenanceProgram = Effect.gen(function* () {
  const billing = yield* BillingReconciliation;
  const automationKv = yield* AutomationKvRepairJob;
  const cancellations = yield* CancellationService;
  const messaging = yield* MessagingService;
  const lifecycle = yield* LifecycleService;
  yield* billing.run();
  yield* cancellations
    .runRetention()
    .pipe(
      Effect.catchCause((cause) =>
        Effect.logError("Cancellation maintenance failed", cause)
      )
    );
  yield* lifecycle.runScheduled();
  yield* messaging.dispatchPending(50);
  for (let batch = 0; batch < MAX_AUTOMATION_KV_BATCHES; batch += 1) {
    const result = yield* automationKv.runBatch(
      // Successful repairs delete their queue rows, so drain from the front.
      0,
      AUTOMATION_KV_BATCH_SIZE
    );
    if (result.nextOffset === null) {
      break;
    }
  }
});

export const runMaintenance = (
  layer: Layer.Layer<AppServices>
): Promise<void> =>
  maintenanceProgram.pipe(Effect.provide(layer), Effect.runPromise);

/** A transaction-scoped advisory lock keeps Node replicas from duplicating maintenance. */
export const runMaintenanceAsLeader = (
  layer: Layer.Layer<AppServices>
): Promise<boolean> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        const rows = yield* sql<{
          leader: boolean;
        }>`SELECT pg_try_advisory_xact_lock(1145395793) AS leader`;
        if (!rows[0]?.leader) {
          return false;
        }
        yield* maintenanceProgram;
        return true;
      })
    );
  }).pipe(Effect.provide(layer), Effect.runPromise);
