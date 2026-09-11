import { AgentWorkspaceService, MaintenanceScheduler } from "@delulu/services";
import { Effect, Layer } from "effect";
import { expect, it, vi } from "vitest";
import { runMaintenance } from "./maintenance";

it.each([
  true,
  false,
])("runs agent recovery only when its lease is acquired: %s", async (due) => {
  const run = vi.fn(() =>
    Effect.succeed({ approvalsExpired: 0, runsTimedOut: 0 })
  );
  const complete = vi.fn(() => Effect.void);
  await runMaintenance(
    Layer.mergeAll(
      Layer.succeed(AgentWorkspaceService, { runMaintenance: run } as never),
      Layer.succeed(MaintenanceScheduler, {
        claim: () => Effect.succeed(due),
        complete,
        fail: () => Effect.void,
      })
    )
  );
  expect(run).toHaveBeenCalledTimes(due ? 1 : 0);
  expect(complete).toHaveBeenCalledTimes(due ? 1 : 0);
  if (due) {
    expect(complete).toHaveBeenCalledWith({
      jobKey: "agent-runtime-maintenance",
      intervalSeconds: 30,
    });
  }
});

it("releases the recovery lease after failure", async () => {
  const fail = vi.fn(() => Effect.void);
  const complete = vi.fn(() => Effect.void);
  await runMaintenance(
    Layer.mergeAll(
      Layer.succeed(AgentWorkspaceService, {
        runMaintenance: () => Effect.die("test failure"),
      } as never),
      Layer.succeed(MaintenanceScheduler, {
        claim: () => Effect.succeed(true),
        complete,
        fail,
      })
    )
  );
  expect(fail).toHaveBeenCalledWith({ jobKey: "agent-runtime-maintenance" });
  expect(complete).not.toHaveBeenCalled();
});
