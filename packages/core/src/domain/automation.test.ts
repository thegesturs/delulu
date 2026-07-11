import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { AutomationStep, AutomationTrigger } from "./automation";

describe("automation domain schemas", () => {
  it("decodes a typed comment trigger", () => {
    const trigger = Schema.decodeUnknownSync(AutomationTrigger)({
      id: "trigger-1",
      type: "trigger",
      triggerType: "comment",
      targetPostIds: ["17890000000000000"],
      keywordFilter: { operator: "contains", value: "link" },
      nextStepId: "step-1",
    });
    expect(trigger.triggerType).toBe("comment");
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
});
