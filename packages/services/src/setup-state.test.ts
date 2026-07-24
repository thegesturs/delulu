import { describe, expect, it } from "vitest";
import { deriveWebSetupStep } from "./setup";

describe("deriveWebSetupStep", () => {
  it("derives the activation step from goal, connections, and completion", () => {
    expect(deriveWebSetupStep(null, [], false)).toBe("goal");
    expect(deriveWebSetupStep("publish", [], false)).toBe("connect");
    expect(deriveWebSetupStep("publish", ["THREADS"], false)).toBe("ready");
    expect(deriveWebSetupStep("auto_dm", ["THREADS"], false)).toBe("connect");
    expect(deriveWebSetupStep("auto_dm", ["INSTAGRAM"], false)).toBe("ready");
    expect(deriveWebSetupStep(null, [], true)).toBe("complete");
  });
});
