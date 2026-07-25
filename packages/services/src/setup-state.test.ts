import { describe, expect, it } from "vitest";
import { deriveWebSetupStep } from "./setup";

describe("deriveWebSetupStep", () => {
  it("derives the activation step from goal, connections, and completion", () => {
    const active = {
      connectionSkipped: false,
      readyAcknowledged: false,
      onboardingComplete: false,
    };
    expect(deriveWebSetupStep(null, [], active)).toBe("goal");
    expect(deriveWebSetupStep("publish", [], active)).toBe("connect");
    expect(deriveWebSetupStep("publish", ["THREADS"], active)).toBe("ready");
    expect(
      deriveWebSetupStep("publish", ["THREADS"], {
        ...active,
        readyAcknowledged: true,
      })
    ).toBe("plan");
    expect(deriveWebSetupStep("auto_dm", ["THREADS"], active)).toBe("connect");
    expect(deriveWebSetupStep("auto_dm", ["INSTAGRAM"], active)).toBe("ready");
    expect(
      deriveWebSetupStep("publish", [], {
        ...active,
        connectionSkipped: true,
      })
    ).toBe("plan");
    expect(
      deriveWebSetupStep(null, [], {
        ...active,
        onboardingComplete: true,
      })
    ).toBe("complete");
  });
});
