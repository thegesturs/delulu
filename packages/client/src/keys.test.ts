import { describe, expect, it } from "vitest";
import { resourceKeyStartsWith, workspaceKeys } from "./keys.js";

describe("resource keys", () => {
  it("matches collection prefixes without crossing workspaces", () => {
    const draftKey = workspaceKeys.list("wrk_1", "posts", {
      status: "draft",
    });

    expect(
      resourceKeyStartsWith(draftKey, workspaceKeys.resource("wrk_1", "posts"))
    ).toBe(true);
    expect(
      resourceKeyStartsWith(draftKey, workspaceKeys.resource("wrk_2", "posts"))
    ).toBe(false);
  });
});
