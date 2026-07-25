import { describe, expect, it } from "vitest";
import { buildCommonAutomation } from "./automation-flow";

const MUTUALLY_EXCLUSIVE = /mutually exclusive/;

describe("automation command payloads", () => {
  it("builds explicit and all-media triggers", () => {
    const specific = buildCommonAutomation("connection_1", {
      name: "Send guide",
      post: ["media_1"],
      keyword: "guide",
      message: "Here you go",
    });
    const all = buildCommonAutomation("connection_1", {
      name: "Always reply",
      allPosts: true,
      message: "Thanks",
    });
    expect(specific.triggers[0]).toMatchObject({
      targetMode: "specific",
      targetPostIds: ["media_1"],
    });
    expect(all.triggers[0]).toMatchObject({
      targetMode: "all",
      targetPostIds: [],
    });
  });

  it("rejects ambiguous targeting", () => {
    expect(() =>
      buildCommonAutomation("connection_1", {
        name: "Broken",
        post: ["media_1"],
        allPosts: true,
        message: "Hello",
      })
    ).toThrow(MUTUALLY_EXCLUSIVE);
  });
});
