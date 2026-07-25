import type { AutomationTrigger } from "@delulu/core/domain/automation";
import { describe, expect, it } from "vitest";
import { ALL_MEDIA_TRIGGER_ID, automationTriggerIndexIds } from "./automations";

const base: AutomationTrigger = {
  id: "trigger-1",
  type: "trigger",
  triggerType: "comment",
  targetMode: "specific",
  targetPostIds: ["media-1", "media-1", "media-2"],
};

describe("automation trigger indexing", () => {
  it("indexes selected media once and all-media targeting separately", () => {
    expect(automationTriggerIndexIds([base])).toEqual(["media-1", "media-2"]);
    expect(
      automationTriggerIndexIds([
        { ...base, targetMode: "all", targetPostIds: [] },
      ])
    ).toEqual([ALL_MEDIA_TRIGGER_ID]);
  });
});
