import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { workspaceKeys } from "./keys.js";
import { mutationEffect, resourceEffect } from "./resource.js";

describe("Effect resource descriptors", () => {
  it("keeps workspace resource keys stable", () => {
    expect(workspaceKeys.list("wrk_1", "posts", { status: "draft" })).toEqual([
      "workspace",
      "wrk_1",
      "posts",
      "list",
      { status: "draft" },
    ]);
  });

  it("keeps reads and writes as Effects", async () => {
    const resource = resourceEffect({
      queryKey: ["example"] as const,
      effect: () => Effect.succeed("resource"),
    });
    const mutation = mutationEffect({
      effect: (value: string) => Effect.succeed(value),
    });

    await expect(Effect.runPromise(resource.effect())).resolves.toBe(
      "resource"
    );
    await expect(Effect.runPromise(mutation.effect("mutation"))).resolves.toBe(
      "mutation"
    );
  });
});
