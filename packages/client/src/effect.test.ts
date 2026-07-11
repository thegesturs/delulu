import { NotFoundError } from "@delulu/contracts";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { runEffect } from "./effect.js";

describe("runEffect", () => {
  it("rejects declared domain errors as the original class instance", async () => {
    const error = new NotFoundError({
      message: "Missing post",
      resource: "post",
    });

    await expect(runEffect(Effect.fail(error))).rejects.toBe(error);
    await expect(runEffect(Effect.fail(error))).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("normalizes non-Error defects to Error", async () => {
    await expect(runEffect(Effect.die("broken transport"))).rejects.toEqual(
      expect.objectContaining({
        name: "Error",
        message: "broken transport",
      })
    );
  });

  it("keeps Error failures as Error instances", async () => {
    const error = new TypeError("network unavailable");
    await expect(runEffect(Effect.fail(error))).rejects.toBe(error);
    await expect(runEffect(Effect.fail(error))).rejects.toBeInstanceOf(Error);
  });
});
