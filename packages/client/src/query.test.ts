import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import type { EffectRunner } from "./effect.js";
import { workspaceKeys } from "./keys.js";
import { effectMutation, effectQuery } from "./query.js";

describe("query integration", () => {
  it("keeps workspace resource keys stable", () => {
    expect(workspaceKeys.list("wrk_1", "posts", { status: "draft" })).toEqual([
      "workspace",
      "wrk_1",
      "posts",
      "list",
      { status: "draft" },
    ]);
    expect(workspaceKeys.resource("wrk_1", "posts")).toEqual([
      "workspace",
      "wrk_1",
      "posts",
    ]);
  });

  it("runs query and mutation Effects through the supplied runner", async () => {
    const run = vi.fn();
    const runner: EffectRunner = {
      run: async <A, E>(_effect: Effect.Effect<A, E>) => {
        run();
        return "done" as A;
      },
    };
    const query = effectQuery({
      queryKey: ["example"] as const,
      effect: () => Effect.succeed("query"),
      runner,
    });
    const mutation = effectMutation({
      effect: (value: string) => Effect.succeed(value),
      runner,
    });

    if (typeof query.queryFn === "function") {
      await query.queryFn({} as never);
    }
    await mutation.mutationFn?.("mutation");

    expect(run).toHaveBeenCalledTimes(2);
  });
});
