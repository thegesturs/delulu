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

  it("rejects temporary browser media ids before creating a poisoned post", () => {
    expect(() =>
      makeSimplePostWrite({
        caption: "Production post",
        connections: [{ id: "connection_aaaaaaaaaaaa", platform: "INSTAGRAM" }],
        mediaIds: ["063286ba-6a68-4656-88bc-97a8e9b2a55e"],
      })
    ).toThrow("Selected media is not ready");
  });

  it("preserves connection-specific Instagram trial reel settings", () => {
    const post = makeSimplePostWrite({
      caption: "Trial reel",
      connections: [
        {
          id: "connection_aaaaaaaaaaaa",
          platform: "INSTAGRAM",
          settings: {
            platform: "INSTAGRAM",
            values: {
              shareToFeed: true,
              shareToStory: false,
              trialReels: true,
              graduationStrategy: "SS_PERFORMANCE",
            },
          },
        },
      ],
    });

    expect(post.targets[0]?.settings).toEqual({
      platform: "INSTAGRAM",
      values: {
        shareToFeed: true,
        shareToStory: false,
        trialReels: true,
        graduationStrategy: "SS_PERFORMANCE",
      },
    });
  });
});
