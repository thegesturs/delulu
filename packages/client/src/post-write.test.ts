import { PostGroupId } from "@delulu/core";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { makeSimplePostWrite } from "./post-write.js";

describe("makeSimplePostWrite", () => {
  it("generates group ids accepted by the backend domain schema", () => {
    const post = makeSimplePostWrite({
      caption: "Production post",
      connections: [{ id: "connection_aaaaaaaaaaaa", platform: "INSTAGRAM" }],
    });

    const groupId = post.groups[0]?.id;
    expect(groupId).toBeDefined();
    expect(() => Schema.decodeUnknownSync(PostGroupId)(groupId)).not.toThrow();
    expect(post.targets[0]?.groupId).toBe(groupId);
  });
});
