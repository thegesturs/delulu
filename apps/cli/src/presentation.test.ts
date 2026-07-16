import { decode } from "@toon-format/toon";
import { describe, expect, it } from "vitest";
import { formatResult } from "./output.js";
import {
  presentAccounts,
  presentOverview,
  presentPosts,
} from "./presentation.js";

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

  it("projects stable unique selectors when account names collide", () => {
    const result = presentAccounts({
      data: [
        {
          id: "connection_one",
          platform: "LINKEDIN",
          username: "same-name",
          displayName: "Same Name",
        },
        {
          id: "connection_two",
          platform: "LINKEDIN",
          username: "same-name",
          displayName: "Same Name",
        },
      ],
      total: 2,
    });
    expect(result.data).toEqual([
      {
        selector: "linkedin:connection_one",
        platform: "LINKEDIN",
        name: "Same Name",
        expires: undefined,
      },
      {
        selector: "linkedin:connection_two",
        platform: "LINKEDIN",
        name: "Same Name",
        expires: undefined,
      },
    ]);
    expect(decode(formatResult(result, "toon"))).toMatchObject({
      data: [
        { selector: "linkedin:connection_one" },
        { selector: "linkedin:connection_two" },
      ],
    });
  });
});
