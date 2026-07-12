import { beforeAll, describe, expect, it } from "vitest";
import { parseSnapshotBuffer } from "../../src/snapshot/reader";
import { TransformFatal } from "../../src/transform/context";
import { COUNTER } from "../../src/transform/counters";
import {
  runTransform,
  type TransformResult,
} from "../../src/transform/pipeline";
import { buildSnapshotZip } from "../fixtures/builder";
import { legacyTables, T } from "../fixtures/legacy-data";

const PUBLISH_JOB_KEY = /^publish-target:post_target_/;
const POST_ID = /^post_/;
const COLLISION = /collision/i;

const transform = async () =>
  runTransform(
    await parseSnapshotBuffer(Buffer.from(buildSnapshotZip(legacyTables)))
  );

const postByLegacy = (result: TransformResult, legacy: string) =>
  result.ctx.load.posts.find((p) => p.legacyConvexId === legacy);

const groupsOf = (content: string) =>
  JSON.parse(content).groups as {
    isDefault: boolean;
    segments: { text: string; media: { id: string }[] }[];
  }[];

describe("runTransform (golden fixture)", () => {
  let result: TransformResult;
  beforeAll(async () => {
    result = await transform();
  });

  it("decodes cleanly", () => {
    expect(result.data.decodeErrors).toEqual([]);
  });

  it("builds the identity spine (users + personal workspaces + owner members)", () => {
    const load = result.ctx.load;
    expect(load.users).toHaveLength(5);
    expect(load.workspaces).toHaveLength(6); // 5 personal + 1 org
    expect(load.workspaces.filter((w) => w.isPersonal)).toHaveLength(5);
    expect(load.workspaceMembers).toHaveLength(8); // 5 owners + 3 org members
  });

  it("maps roles: creator→owner, admin→admin, member→editor; no viewers", () => {
    const roles = new Map(
      result.ctx.roleAudit.map((r) => [r.email, r.newRole])
    );
    expect(roles.get("carol@example.com")).toBe("owner");
    expect(roles.get("dave@example.com")).toBe("admin");
    expect(roles.get("erin@example.com")).toBe("editor");
    expect(
      result.ctx.load.workspaceMembers.some((m) => m.role === "viewer")
    ).toBe(false);
  });

  it("prepends title for unpublished posts and drops it for published", () => {
    const draft = postByLegacy(result, "post_alice_draft");
    expect(groupsOf(draft!.content)[0].segments[0].text).toBe(
      "My Title\n\nhello world"
    );
    const published = postByLegacy(result, "post_acme_published");
    expect(groupsOf(published!.content)[0].segments[0].text).toBe(
      "published body"
    );
  });

  it("creates a distinct group for distinct alternativeContent and collapses identical", () => {
    const distinct = postByLegacy(result, "post_alice_alt_distinct");
    expect(groupsOf(distinct!.content)).toHaveLength(2);
    const identical = postByLegacy(result, "post_alice_alt_identical");
    expect(groupsOf(identical!.content)).toHaveLength(1);
  });

  it("synthesizes an empty segment for empty content", () => {
    const empty = postByLegacy(result, "post_alice_empty");
    const groups = groupsOf(empty!.content);
    expect(groups[0].segments).toEqual([{ text: "", media: [] }]);
  });

  it("computes post status from targets + review overlay", () => {
    const status = (legacy: string) => postByLegacy(result, legacy)?.status;
    expect(status("post_alice_draft")).toBe("draft");
    expect(status("post_alice_scheduled")).toBe("scheduled");
    expect(status("post_acme_published")).toBe("published");
    expect(status("post_alice_processing")).toBe("failed");
    expect(status("post_acme_review_pending")).toBe("pending_review");
  });

  it("maps published/failed targets and marks PROCESSING failed with the interruption error", () => {
    const targets = result.ctx.load.postTargets;
    const published = targets.find((t) => t.platformPostId === "tw123");
    expect(published?.status).toBe("published");
    const processing = targets.filter((t) =>
      t.error?.includes("interrupted by the platform migration")
    );
    expect(processing).toHaveLength(1);
    expect(processing[0].status).toBe("failed");
  });

  it("emits a jobs row for the pending scheduled target only", () => {
    expect(result.ctx.load.jobs).toHaveLength(1);
    expect(result.ctx.load.jobs[0].idempotencyKey).toMatch(PUBLISH_JOB_KEY);
  });

  it("synthesizes a placeholder automation for a connection with only contacts", () => {
    const placeholder = result.ctx.load.automations.find(
      (a) => a.name === "Imported contacts"
    );
    expect(placeholder).toBeDefined();
    expect(placeholder?.enabled).toBe(false);
    expect(result.ctx.load.automationContacts).toHaveLength(2);
  });

  it("remaps pendingPostIds and drops dangling ones", () => {
    const auto = result.ctx.load.automations.find(
      (a) => a.legacyConvexId === "auto_alice_ig"
    );
    const triggers = JSON.parse(auto!.triggers) as {
      pendingPostIds: string[];
    }[];
    expect(triggers[0].pendingPostIds).toHaveLength(1); // one remapped, one dangling dropped
    expect(triggers[0].pendingPostIds[0]).toMatch(POST_ID);
  });

  it("synthesizes one subscription per user, defaulting to FREE", () => {
    expect(result.ctx.load.subscriptions).toHaveLength(5);
    expect(result.ctx.counters.get(COUNTER.subscriptionsFreeSynthesized)).toBe(
      3
    );
  });

  it("records the expected edge-case counters", () => {
    const c = result.ctx.counters;
    expect(c.get(COUNTER.postsTitlePrepended)).toBe(1);
    expect(c.get(COUNTER.postsTitleDropped)).toBe(1);
    expect(c.get(COUNTER.altContentDistinct)).toBe(1);
    expect(c.get(COUNTER.altContentCollapsed)).toBe(1);
    expect(c.get(COUNTER.postsEmptyContent)).toBe(1);
    expect(c.get(COUNTER.targetsProcessingInterrupted)).toBe(1);
    expect(c.get(COUNTER.jobsEmitted)).toBe(1);
    expect(c.get(COUNTER.automationsPlaceholderCreated)).toBe(1);
    expect(c.get(COUNTER.automationPendingPostDropped)).toBe(1);
    expect(c.get(COUNTER.connectionsExpiresNulled)).toBe(1);
    expect(c.get(COUNTER.targetsSettingsTikTokFallback)).toBe(1);
    expect(c.get(COUNTER.mediaSynthesizedUnresolved)).toBe(1);
    expect(c.get(COUNTER.mediaSynthesizedCrossWorkspace)).toBe(1);
  });

  it("nulls a provider expiry that isn't a plausible epoch-ms timestamp", () => {
    const tiktok = result.ctx.load.connections.find(
      (c) => c.platform === "TIKTOK"
    );
    expect(tiktok?.expiresAt).toBeNull();
  });
});

describe("runTransform org handling", () => {
  it("drops a post whose org was deleted instead of failing", async () => {
    const withOrphan = {
      ...legacyTables,
      posts: [
        ...legacyTables.posts,
        {
          _id: "post_orphan_org",
          _creationTime: T,
          userId: "user_alice",
          organizationId: "org_deleted_does_not_exist",
          status: "SAVED",
          reviewStatus: "PENDING",
          isDeleted: false,
          privacyStatus: "PUBLIC",
          content: [{ order: 0, name: "d", text: "orphan", media: [] }],
          socialProviderIds: ["sp_alice_ig"],
          retryCount: 0,
          createdAt: T,
          updatedAt: T,
        },
      ],
    };
    const snapshot = await parseSnapshotBuffer(
      Buffer.from(buildSnapshotZip(withOrphan))
    );
    const result = await runTransform(snapshot);
    expect(
      result.ctx.load.posts.some((p) => p.legacyConvexId === "post_orphan_org")
    ).toBe(false);
    expect(result.ctx.counters.get(COUNTER.postsDroppedDeletedOrg)).toBe(1);
    // The other 9 golden posts still migrate.
    expect(result.ctx.load.posts).toHaveLength(9);
  });
});

describe("runTransform fatal invariants", () => {
  it("fails hard when a user has no externalId", async () => {
    const broken = {
      ...legacyTables,
      users: [
        ...legacyTables.users,
        {
          _id: "user_noext",
          _creationTime: 1,
          email: "x@y.z",
          name: "No Ext",
          usage: {},
          updatedAt: 1,
        },
      ],
    };
    const snapshot = await parseSnapshotBuffer(
      Buffer.from(buildSnapshotZip(broken))
    );
    await expect(runTransform(snapshot)).rejects.toBeInstanceOf(TransformFatal);
  });

  it("fails hard on a cross-owner (platform, profile_id) collision", async () => {
    const broken = {
      ...legacyTables,
      socialProviders: [
        ...legacyTables.socialProviders,
        {
          _id: "sp_bob_ig_dup",
          _creationTime: 1,
          userId: "user_bob",
          accessToken: "c",
          expiresIn: 2_000_000_000_000,
          profileId: "ig_alice", // same (INSTAGRAM, ig_alice) as alice → cross-owner
          fullName: "Bob",
          socialType: "INSTAGRAM",
          isActive: true,
          updatedAt: 1,
        },
      ],
    };
    const snapshot = await parseSnapshotBuffer(
      Buffer.from(buildSnapshotZip(broken))
    );
    await expect(runTransform(snapshot)).rejects.toThrow(COLLISION);
  });
});
