import { describe, expect, it } from "vitest";
import {
  automationFromResource,
  getApiErrorDetails,
  triggersToResource,
} from "./automation-resource";

describe("automation resource adapters", () => {
  it("converts trigger casing at the API boundary", () => {
    const triggers = triggersToResource([
      {
        id: "trigger_1",
        type: "trigger",
        triggerType: "STORY_REPLY",
        targetPostIds: [],
      },
    ]);

    expect(triggers[0]?.triggerType).toBe("story_reply");
    expect(
      automationFromResource({
        id: "aut_1",
        workspaceId: "ws_1",
        connectionId: "con_1",
        platform: "instagram",
        category: "dm",
        name: "Replies",
        description: null,
        enabled: true,
        triggers,
        steps: [],
        notes: [],
        nodePositions: {},
        totalTriggered: 0,
        totalDmsSent: 0,
        totalFailed: 0,
        createdAt: "2026-07-11T00:00:00.000Z",
        updatedAt: "2026-07-11T00:00:00.000Z",
      }).triggers[0]?.triggerType
    ).toBe("STORY_REPLY");
  });

  it("distinguishes tagged domain errors from transport failures", () => {
    expect(
      getApiErrorDetails({
        _tag: "ForbiddenError",
        message: "You cannot edit this automation",
      })
    ).toEqual({
      kind: "permission",
      message: "You cannot edit this automation",
    });
    expect(getApiErrorDetails(new Error("Network unavailable")).kind).toBe(
      "transport"
    );
  });
});
