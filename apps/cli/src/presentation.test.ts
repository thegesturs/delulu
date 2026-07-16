import { describe, expect, it } from "vitest";
import { presentOverview, presentPosts } from "./presentation.js";

describe("CLI projections", () => {
  it("keeps default post rows to four fields and reports zero explicitly", () => {
    const empty = presentPosts(
      { data: [], total: 0, limit: 10, offset: 0 },
      { workspaceId: "workspace_1" }
    );
    expect(empty.message).toBe("0 posts");

    const result = presentPosts(
      {
        data: [
          {
            id: "post_1",
            status: "draft",
            groups: [{ segments: [{ text: "A".repeat(200) }] }],
            targets: [],
            updatedAt: "2026-07-16T00:00:00Z",
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      },
      { workspaceId: "workspace_1" }
    );
    expect(
      Object.keys((result.data as Record<string, unknown>[])[0] ?? {})
    ).toEqual(["id", "state", "when", "caption"]);
    expect((result.data as { caption: string }[])[0]?.caption).toContain(
      "[+40 chars]"
    );
  });

  it("chooses one deterministic highest-priority action", () => {
    const result = presentOverview({
      workspace: { name: "Personal", role: "owner" },
      setup: {
        onboardingComplete: true,
        outstandingAction: null,
        connectedPlatforms: ["LINKEDIN"],
      },
      accounts: { total: 1, expiringSoon: 1 },
      subscription: { plan: "VIBE" },
      publishing: { totalPosts: 3, failed: 1, partiallyFailed: 0 },
      reviews: { pending: 1 },
    });
    expect(result.next).toEqual(["delulu accounts"]);
  });
});
