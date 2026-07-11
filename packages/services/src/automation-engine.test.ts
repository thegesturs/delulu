import type { AutomationTrigger } from "@delulu/core/domain/automation";
import { describe, expect, it } from "vitest";
import { keywordMatches } from "./automation-engine";

const trigger = (
  operator: AutomationTrigger["keywordFilter"] extends infer _
    ?
        | "contains"
        | "not_contains"
        | "equals"
        | "starts_with"
        | "ends_with"
        | "regex"
        | "always"
    : never,
  value?: string
): AutomationTrigger => ({
  id: "trigger-1",
  type: "trigger",
  triggerType: "comment",
  targetPostIds: ["media-1"],
  keywordFilter: { operator, value },
});

describe("automation trigger evaluation", () => {
  it("matches keyword operators case-insensitively by default", () => {
    expect(
      keywordMatches(trigger("contains", "LINK"), "send link please")
    ).toBe(true);
    expect(keywordMatches(trigger("equals", "hello"), "HELLO")).toBe(true);
    expect(
      keywordMatches(trigger("not_contains", "spam"), "real comment")
    ).toBe(true);
  });

  it("fails closed for invalid or oversized regex patterns", () => {
    expect(keywordMatches(trigger("regex", "["), "anything")).toBe(false);
    expect(keywordMatches(trigger("regex", "x".repeat(257)), "anything")).toBe(
      false
    );
  });
});
