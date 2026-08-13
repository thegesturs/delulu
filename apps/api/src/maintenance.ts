import {
  AgentWorkspaceService,
  AutomationKvRepairJob,
  BillingReconciliation,
  CancellationService,
  LifecycleService,
  MaintenanceScheduler,
  MessagingService,
} from "@delulu/services";
import { Effect, type Layer } from "effect";
import type { AppServices } from "./app";

const AUTOMATION_KV_BATCH_SIZE = 200;
const MAX_AUTOMATION_KV_BATCHES = 10;
const MINUTELY_CADENCE_SECONDS = 30;
const HOURLY_CADENCE_SECONDS = 60 * 60;
const DAILY_CADENCE_SECONDS = 24 * HOURLY_CADENCE_SECONDS;
const WEEKLY_CADENCE_SECONDS = 7 * DAILY_CADENCE_SECONDS;

/** Bounded, replay-safe maintenance invoked by Worker cron and Node runtimes. */
const maintenanceProgram = Effect.gen(function* () {
  const scheduler = yield* MaintenanceScheduler;
  const billing = yield* BillingReconciliation;
  const automationKv = yield* AutomationKvRepairJob;
  const cancellations = yield* CancellationService;
  const messaging = yield* MessagingService;
  const lifecycle = yield* LifecycleService;
  const agents = yield* AgentWorkspaceService;

  const runDue = Effect.fn("Maintenance.runDue")(function* (
    jobKey: string,
    intervalSeconds: number,
    job: Effect.Effect<unknown, unknown>
  ) {
    if (!(yield* scheduler.claim({ jobKey }))) {
      return;
    }
    const result = yield* job.pipe(Effect.exit);
    if (result._tag === "Success") {
      yield* scheduler.complete({ jobKey, intervalSeconds });
      return;
    }
    yield* scheduler.fail({ jobKey });
    yield* Effect.logError("Maintenance job failed", {
      jobKey,
      cause: result.cause,
    });
  });

  yield* runDue(
    "agent-runtime-maintenance",
    MINUTELY_CADENCE_SECONDS,
    agents.runMaintenance()
  );
  yield* runDue(
    "billing-reconciliation",
    HOURLY_CADENCE_SECONDS,
    billing.run()
  );
  yield* runDue(
    "cancellation-retention",
    HOURLY_CADENCE_SECONDS,
    cancellations.runRetention()
  );
  yield* runDue(
    "lifecycle-inactive",
    DAILY_CADENCE_SECONDS,
    lifecycle.runInactive()
  );
  yield* runDue(
    "lifecycle-weekly",
    WEEKLY_CADENCE_SECONDS,
    lifecycle.runWeekly()
  );
  yield* runDue(
    "message-retention",
    DAILY_CADENCE_SECONDS,
    messaging.runRetention()
  );
  yield* runDue(
    "message-dispatch",
    MINUTELY_CADENCE_SECONDS,
    messaging.dispatchPending(50)
  );
  yield* runDue(
    "automation-kv-repair",
    MINUTELY_CADENCE_SECONDS,
    Effect.gen(function* () {
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
    })
  );
});

export const runMaintenance = (
  layer: Layer.Layer<AppServices>
): Promise<void> =>
  maintenanceProgram.pipe(Effect.provide(layer), Effect.runPromise);

/** Compatibility entrypoint; durable job leases now coordinate all replicas. */
export const runMaintenanceAsLeader = async (
  layer: Layer.Layer<AppServices>
): Promise<boolean> => {
  await runMaintenance(layer);
  return true;
};
