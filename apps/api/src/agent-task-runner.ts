import { AgentComputerService, WorkspaceFileService } from "@delulu/services";
import { Effect, type Layer } from "effect";
import type { AppServices } from "./app";

/** Drain a bounded batch; SQL row leases make concurrent replicas safe. */
export const runAgentTasks = (
  layer: Layer.Layer<AppServices>
): Promise<number> =>
  Effect.gen(function* () {
    const computers = yield* AgentComputerService;
    const files = yield* WorkspaceFileService;
    const tasks = yield* computers.runPending(1);
    yield* files.runDeletionCleanup(10);
    return tasks;
  }).pipe(Effect.provide(layer), Effect.runPromise);
