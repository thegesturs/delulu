import { describe, expect, it } from "vitest";
import {
  contentFingerprint,
  rollupPostStatus,
  validateContentGraph,
} from "./post-behavior";

const content = {
  groups: [
    {
      id: "post_group_aaaaaaaaaaaa",
      isDefault: true,
      segments: [{ text: "Hello", media: [] }],
    },
    {
      id: "post_group_bbbbbbbbbbbb",
      isDefault: false,
      segments: [{ text: "Hello LinkedIn", media: [] }],
    },
  ],
};

describe("post domain behavior", () => {
  it("accepts a total target-to-group mapping", () => {
    expect(
      validateContentGraph(content, [
        { groupId: "post_group_aaaaaaaaaaaa" },
        { groupId: "post_group_bbbbbbbbbbbb" },
      ])
    ).toEqual([]);
  });

  it("rejects missing groups, duplicate defaults, and dangling targets", () => {
    expect(
      validateContentGraph(
        {
          groups: [
            ...content.groups,
            {
              id: "post_group_cccccccccccc",
              isDefault: true,
              segments: [],
            },
          ],
        },
        [{ groupId: "post_group_dddddddddddd" }]
      )
    ).toEqual([
      { path: "content.groups", message: "Exactly one group must be default" },
      {
        path: "content.groups[2].segments",
        message: "Each group must contain at least one segment",
      },
      {
        path: "targets[0].groupId",
        message: "Target references a group that does not exist",
      },
    ]);
  });

  it("rolls target outcomes into the stored post status", () => {
    expect(rollupPostStatus(["published", "failed"])).toBe("partially_failed");
    expect(rollupPostStatus(["failed", "failed"])).toBe("failed");
    expect(rollupPostStatus(["publishing", "pending"])).toBe("publishing");
    expect(rollupPostStatus(["pending", "pending"])).toBe("scheduled");
  });

  it("lets an active review override target rollup", () => {
    expect(rollupPostStatus(["pending"], "pending")).toBe("pending_review");
    expect(rollupPostStatus(["pending"], "rejected")).toBe("changes_requested");
  });

  it("fingerprints canonical content independently of object key order", async () => {
    const reordered = {
      groups: content.groups.map((group) => ({
        segments: group.segments,
        isDefault: group.isDefault,
        id: group.id,
      })),
    };
    expect(await contentFingerprint(content)).toBe(
      await contentFingerprint(reordered)
    );
    expect(
      await contentFingerprint({
        groups: [
          {
            ...content.groups[0],
            segments: [{ text: "Changed", media: [] }],
          },
        ],
      })
    ).not.toBe(await contentFingerprint(content));
  });
});
