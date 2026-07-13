import { AutomationKvRepairJob, BillingReconciliation } from "@delulu/services";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import type { AppServices } from "./app";
import { runMaintenance } from "./maintenance";

const makeLayer = (
  runBatch: AutomationKvRepairJob["Service"]["runBatch"],
  onBillingRun: () => void = () => undefined
) =>
  Layer.merge(
    Layer.succeed(
      BillingReconciliation,
      BillingReconciliation.of({
        run: () =>
          Effect.sync(() => {
            onBillingRun();
            return { subscriptionsUpdated: 0, reservationsExpired: 0 };
          }),
      })
    ),
    Layer.succeed(AutomationKvRepairJob, AutomationKvRepairJob.of({ runBatch }))
  ) as Layer.Layer<AppServices>;

describe("runMaintenance", () => {
  it("repairs successive KV batches until the job reports completion", async () => {
    const offsets: number[] = [];
    let billingRuns = 0;
    let pendingRepairs = 412;

    await runMaintenance(
      makeLayer(
        (offset, batchSize = 200) =>
          Effect.sync(() => {
            offsets.push(offset);
            const repaired = Math.min(batchSize, pendingRepairs);
            pendingRepairs -= repaired;
            return {
              repaired,
              nextOffset: repaired < batchSize ? null : offset + repaired,
            };
          }),
        () => {
          billingRuns += 1;
        }
      )
    );

    expect(billingRuns).toBe(1);
    expect(offsets).toEqual([0, 0, 0]);
    expect(pendingRepairs).toBe(0);
  });

  it("caps KV repair work at ten batches per cron tick", async () => {
    const offsets: number[] = [];

    await runMaintenance(
      makeLayer((offset) =>
        Effect.sync(() => {
          offsets.push(offset);
          return { repaired: 200, nextOffset: offset + 200 };
        })
      )
    );

    expect(offsets).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
