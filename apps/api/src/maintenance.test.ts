import {
  AgentWorkspaceService,
  AutomationKvRepairJob,
  BillingReconciliation,
  CancellationService,
  LifecycleService,
  MaintenanceScheduler,
  MessagingService,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import type { AppServices } from "./app";
import { runMaintenance } from "./maintenance";

const allJobs = new Set([
  "agent-runtime-maintenance",
  "billing-reconciliation",
  "cancellation-retention",
  "lifecycle-inactive",
  "lifecycle-weekly",
  "message-retention",
  "message-dispatch",
  "automation-kv-repair",
]);

const makeLayer = (input: {
  readonly due?: ReadonlySet<string>;
  readonly runBatch?: AutomationKvRepairJob["Service"]["runBatch"];
  readonly calls?: string[];
}) => {
  const calls = input.calls ?? [];
  const due = input.due ?? allJobs;
  return Layer.mergeAll(
    Layer.succeed(
      AgentWorkspaceService,
      AgentWorkspaceService.of({
        runMaintenance: () =>
          Effect.sync(() => {
            calls.push("run:agent-runtime");
            return { approvalsExpired: 0, runsTimedOut: 0 };
          }),
      } as never)
    ),
    Layer.succeed(
      MaintenanceScheduler,
      MaintenanceScheduler.of({
        claim: ({ jobKey }) =>
          Effect.sync(() => {
            calls.push(`claim:${jobKey}`);
            return due.has(jobKey);
          }),
        complete: ({ jobKey, intervalSeconds }) =>
          Effect.sync(() => {
            calls.push(`complete:${jobKey}:${intervalSeconds}`);
          }),
        fail: ({ jobKey }) =>
          Effect.sync(() => {
            calls.push(`fail:${jobKey}`);
          }),
      })
    ),
    Layer.succeed(
      BillingReconciliation,
      BillingReconciliation.of({
        run: () =>
          Effect.sync(() => {
            calls.push("run:billing");
            return { subscriptionsUpdated: 0, reservationsExpired: 0 };
          }),
      })
    ),
    Layer.succeed(
      AutomationKvRepairJob,
      AutomationKvRepairJob.of({
        runBatch:
          input.runBatch ??
          (() =>
            Effect.sync(() => {
              calls.push("run:automation-kv");
              return { repaired: 0, nextOffset: null };
            })),
      })
    ),
    Layer.succeed(
      CancellationService,
      CancellationService.of({
        runRetention: () =>
          Effect.sync(() => {
            calls.push("run:cancellation-retention");
          }),
      } as never)
    ),
    Layer.succeed(
      LifecycleService,
      LifecycleService.of({
        runInactive: () =>
          Effect.sync(() => {
            calls.push("run:lifecycle-inactive");
          }),
        runWeekly: () =>
          Effect.sync(() => {
            calls.push("run:lifecycle-weekly");
          }),
      } as never)
    ),
    Layer.succeed(
      MessagingService,
      MessagingService.of({
        runRetention: () =>
          Effect.sync(() => {
            calls.push("run:message-retention");
            return { deleted: 0, redacted: 0 };
          }),
        dispatchPending: () =>
          Effect.sync(() => {
            calls.push("run:message-dispatch");
            return 0;
          }),
      } as never)
    )
  ) as Layer.Layer<AppServices>;
};

describe("runMaintenance", () => {
  it("runs each maintenance concern only after acquiring its durable cadence", async () => {
    const calls: string[] = [];

    await runMaintenance(makeLayer({ calls }));

    expect(calls).toEqual([
      "claim:agent-runtime-maintenance",
      "run:agent-runtime",
      "complete:agent-runtime-maintenance:30",
      "claim:billing-reconciliation",
      "run:billing",
      "complete:billing-reconciliation:3600",
      "claim:cancellation-retention",
      "run:cancellation-retention",
      "complete:cancellation-retention:3600",
      "claim:lifecycle-inactive",
      "run:lifecycle-inactive",
      "complete:lifecycle-inactive:86400",
      "claim:lifecycle-weekly",
      "run:lifecycle-weekly",
      "complete:lifecycle-weekly:604800",
      "claim:message-retention",
      "run:message-retention",
      "complete:message-retention:86400",
      "claim:message-dispatch",
      "run:message-dispatch",
      "complete:message-dispatch:30",
      "claim:automation-kv-repair",
      "run:automation-kv",
      "complete:automation-kv-repair:30",
    ]);
  });

  it("skips work when another replica owns the cadence", async () => {
    const calls: string[] = [];

    await runMaintenance(
      makeLayer({ calls, due: new Set(["message-dispatch"]) })
    );

    expect(calls.filter((call) => call.startsWith("run:"))).toEqual([
      "run:message-dispatch",
    ]);
  });

  it("repairs successive KV batches until the job reports completion", async () => {
    const offsets: number[] = [];
    let pendingRepairs = 412;

    await runMaintenance(
      makeLayer({
        due: new Set(["automation-kv-repair"]),
        runBatch: (offset, batchSize = 200) =>
          Effect.sync(() => {
            offsets.push(offset);
            const repaired = Math.min(batchSize, pendingRepairs);
            pendingRepairs -= repaired;
            return {
              repaired,
              nextOffset: repaired < batchSize ? null : offset + repaired,
            };
          }),
      })
    );

    expect(offsets).toEqual([0, 0, 0]);
    expect(pendingRepairs).toBe(0);
  });

  it("caps KV repair work at ten batches per cadence", async () => {
    const offsets: number[] = [];

    await runMaintenance(
      makeLayer({
        due: new Set(["automation-kv-repair"]),
        runBatch: (offset) =>
          Effect.sync(() => {
            offsets.push(offset);
            return { repaired: 200, nextOffset: offset + 200 };
          }),
      })
    );

    expect(offsets).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
