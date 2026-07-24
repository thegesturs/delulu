import { describe, expect, it } from "vitest";
import { deriveWebSetupStep } from "./setup";

describe("deriveWebSetupStep", () => {
  it("derives the activation step from goal, connections, and completion", () => {
    expect(deriveWebSetupStep(null, [], false, false)).toBe("goal");
    expect(deriveWebSetupStep("publish", [], false, false)).toBe("connect");
    expect(deriveWebSetupStep("publish", ["THREADS"], false, false)).toBe(
      "ready"
    );
    expect(deriveWebSetupStep("publish", ["THREADS"], true, false)).toBe(
      "plan"
    );
    expect(deriveWebSetupStep("auto_dm", ["THREADS"], false, false)).toBe(
      "connect"
    );
    expect(deriveWebSetupStep("auto_dm", ["INSTAGRAM"], false, false)).toBe(
      "ready"
    );
    expect(deriveWebSetupStep(null, [], false, true)).toBe("complete");
  });
});
