import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  AutomationStep,
  AutomationTrigger,
  automationButtonValidationIssues,
  automationStepValidationIssues,
  automationTriggerTargetMode,
  automationTriggerValidationIssues,
  resolvePendingAutomationTriggers,
} from "./automation";

describe("automation domain schemas", () => {
  it("decodes a typed comment trigger", () => {
    const trigger = Schema.decodeUnknownSync(AutomationTrigger)({
      id: "trigger-1",
      type: "trigger",
      triggerType: "comment",
      targetMode: "specific",
      targetPostIds: ["17890000000000000"],
      keywordFilter: { operator: "contains", value: "link" },
      nextStepId: "step-1",
    });
    expect(trigger.triggerType).toBe("comment");
    expect(automationTriggerTargetMode(trigger)).toBe("specific");
  });

  it("preserves legacy all-post targeting while exposing an explicit mode", () => {
    const legacy = Schema.decodeUnknownSync(AutomationTrigger)({
      id: "trigger-legacy",
      type: "trigger",
      triggerType: "comment",
      targetPostIds: [],
    });
    const explicit = Schema.decodeUnknownSync(AutomationTrigger)({
      id: "trigger-all",
      type: "trigger",
      triggerType: "comment",
      targetMode: "all",
      targetPostIds: [],
    });

    expect(automationTriggerTargetMode(legacy)).toBe("all");
    expect(automationTriggerTargetMode(explicit)).toBe("all");
    expect(
      automationTriggerTargetMode(
        Schema.decodeUnknownSync(AutomationTrigger)({
          ...legacy,
          pendingPostIds: ["post_123456789012"],
        })
      )
    ).toBe("specific");
  });

  it("enforces specific and all targeting invariants", () => {
    const invalidSpecific = Schema.decodeUnknownSync(AutomationTrigger)({
      id: "trigger-specific",
      type: "trigger",
      triggerType: "comment",
      targetMode: "specific",
      targetPostIds: [],
    });
    const invalidAll = Schema.decodeUnknownSync(AutomationTrigger)({
      id: "trigger-all",
      type: "trigger",
      triggerType: "comment",
      targetMode: "all",
      targetPostIds: ["media-1"],
    });
    expect(
      automationTriggerValidationIssues([invalidSpecific, invalidAll])
    ).toEqual([
      expect.objectContaining({ path: "triggers.0" }),
      expect.objectContaining({ path: "triggers.1" }),
    ]);
    expect(automationTriggerValidationIssues([])).toEqual([
      expect.objectContaining({ path: "triggers" }),
    ]);
  });

  it("resolves a scheduled post to its platform media id idempotently", () => {
    const triggers = [
      Schema.decodeUnknownSync(AutomationTrigger)({
        id: "trigger-pending",
        type: "trigger",
        triggerType: "comment",
        targetMode: "specific",
        targetPostIds: [],
        pendingPostIds: ["post_123456789012", "post_210987654321"],
      }),
    ];

    const first = resolvePendingAutomationTriggers(
      triggers,
      "post_123456789012",
      "media-1"
    );
    const second = resolvePendingAutomationTriggers(
      first,
      "post_123456789012",
      "media-1"
    );

    expect(first[0]?.targetPostIds).toEqual(["media-1"]);
    expect(first[0]?.pendingPostIds).toEqual(["post_210987654321"]);
    expect(second).toEqual(first);
  });

  it("rejects untrusted steps with unsupported types", () => {
    expect(() =>
      Schema.decodeUnknownSync(AutomationStep)({
        id: "step-1",
        type: "http_request",
        url: "https://example.com",
      })
    ).toThrow();
  });

  it("limits button templates to three combined actions", () => {
    const buttons = [
      { type: "url" as const, title: "Guide", url: "https://example.com" },
      {
        type: "quick_reply" as const,
        title: "One",
        payload: "one",
      },
      {
        type: "quick_reply" as const,
        title: "Two",
        payload: "two",
      },
      {
        type: "quick_reply" as const,
        title: "Three",
        payload: "three",
      },
    ];

    expect(automationButtonValidationIssues(buttons)).toEqual([
      expect.objectContaining({ path: "buttons" }),
    ]);
    expect(
      automationStepValidationIssues([
        {
          id: "step-1",
          type: "send_dm",
          messageTemplate: "Choose",
          buttons,
        },
      ])
    ).toEqual([expect.objectContaining({ path: "steps.0.buttons" })]);
    expect(
      automationButtonValidationIssues(
        buttons.filter((button) => button.type === "quick_reply")
      )
    ).toEqual([]);
  });
});
