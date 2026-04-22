import { describe, expect, it } from "vitest";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { sessionOp, triggerDiff } from "../convex/lib/trigger_kv_sync";

// Minimal automation factory — only the fields that triggerDiff reads.
// Cast because we don't need a full Doc<"automations"> for these tests.
function makeAutomation(
  overrides: {
    id?: string;
    isActive?: boolean;
    targetPostIdsByTrigger?: string[][];
    socialProviderId?: string;
  } = {}
): Doc<"automations"> {
  const id = overrides.id ?? "auto1";
  const triggers = (overrides.targetPostIdsByTrigger ?? [["m1"]]).map(
    (postIds, i) => ({
      id: `t${i}`,
      type: "trigger" as const,
      triggerType: "COMMENT" as const,
      targetPostIds: postIds,
    })
  );
  return {
    _id: id as Id<"automations">,
    _creationTime: 0,
    socialProviderId: (overrides.socialProviderId ??
      "sp1") as Id<"socialProviders">,
    name: "test",
    isActive: overrides.isActive ?? true,
    triggers,
    steps: [],
    totalTriggered: 0,
    totalDMsSent: 0,
    totalFailed: 0,
    createdAt: 0,
    updatedAt: 0,
  } as unknown as Doc<"automations">;
}

function makeSession(overrides: {
  id?: string;
  instagramUserId?: string;
  status?: "active" | "completed" | "expired";
}): Doc<"automationSessions"> {
  return {
    _id: (overrides.id ?? "sess1") as Id<"automationSessions">,
    _creationTime: 0,
    automationId: "auto1" as Id<"automations">,
    userId: "user1" as Id<"users">,
    instagramUserId: overrides.instagramUserId ?? "ig_user_1",
    currentStepId: "s1",
    status: overrides.status ?? "active",
    lastActivityAt: 0,
    createdAt: 0,
  } as unknown as Doc<"automationSessions">;
}

describe("triggerDiff", () => {
  const profileId = "profile_A";

  it("returns empty ops when profileId is null (e.g. deleted provider)", () => {
    const newA = makeAutomation({ id: "a1", targetPostIdsByTrigger: [["m1"]] });
    expect(triggerDiff(null, newA, null)).toEqual([]);
    expect(triggerDiff(newA, null, null)).toEqual([]);
  });

  it("create active automation → one add per mediaId", () => {
    const newA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m1", "m2"], ["m3"]],
    });
    const ops = triggerDiff(null, newA, profileId);
    expect(ops).toHaveLength(3);
    expect(ops.every((op) => op.op === "add")).toBe(true);
    expect(ops.every((op) => op.profileId === profileId)).toBe(true);
    expect(ops.every((op) => op.automationId === newA._id)).toBe(true);
    const mediaIds = ops.map((op) => op.mediaId).sort();
    expect(mediaIds).toEqual(["m1", "m2", "m3"]);
  });

  it("create inactive automation → no ops (nothing to register)", () => {
    const newA = makeAutomation({ id: "a1", isActive: false });
    expect(triggerDiff(null, newA, profileId)).toEqual([]);
  });

  it("delete active automation → one remove per mediaId", () => {
    const oldA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m1"], ["m2"]],
    });
    const ops = triggerDiff(oldA, null, profileId);
    expect(ops).toHaveLength(2);
    expect(ops.every((op) => op.op === "remove")).toBe(true);
    expect(ops.map((o) => o.mediaId).sort()).toEqual(["m1", "m2"]);
  });

  it("delete inactive automation → no ops (wasn't in KV anyway)", () => {
    const oldA = makeAutomation({
      id: "a1",
      isActive: false,
      targetPostIdsByTrigger: [["m1"]],
    });
    expect(triggerDiff(oldA, null, profileId)).toEqual([]);
  });

  it("update: add a new mediaId, remove a dropped one", () => {
    const oldA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m1", "m2"]],
    });
    const newA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m2", "m3"]],
    });
    const ops = triggerDiff(oldA, newA, profileId);
    expect(ops).toHaveLength(2);
    const byMedia = new Map(ops.map((op) => [op.mediaId, op.op]));
    expect(byMedia.get("m3")).toBe("add");
    expect(byMedia.get("m1")).toBe("remove");
    expect(byMedia.has("m2")).toBe(false); // unchanged, no op
  });

  it("toggle active → inactive: removes every mediaId", () => {
    const oldA = makeAutomation({
      id: "a1",
      isActive: true,
      targetPostIdsByTrigger: [["m1", "m2"]],
    });
    const newA = makeAutomation({
      id: "a1",
      isActive: false,
      targetPostIdsByTrigger: [["m1", "m2"]],
    });
    const ops = triggerDiff(oldA, newA, profileId);
    expect(ops).toHaveLength(2);
    expect(ops.every((op) => op.op === "remove")).toBe(true);
  });

  it("toggle inactive → active: adds every mediaId", () => {
    const oldA = makeAutomation({
      id: "a1",
      isActive: false,
      targetPostIdsByTrigger: [["m1", "m2"]],
    });
    const newA = makeAutomation({
      id: "a1",
      isActive: true,
      targetPostIdsByTrigger: [["m1", "m2"]],
    });
    const ops = triggerDiff(oldA, newA, profileId);
    expect(ops).toHaveLength(2);
    expect(ops.every((op) => op.op === "add")).toBe(true);
  });

  it("update with no trigger changes + no isActive change → no ops", () => {
    const oldA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m1"]],
    });
    const newA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m1"]],
    });
    expect(triggerDiff(oldA, newA, profileId)).toEqual([]);
  });

  it("dedups the same mediaId across multiple triggers", () => {
    const newA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["m1"], ["m1"], ["m1", "m2"]],
    });
    const ops = triggerDiff(null, newA, profileId);
    expect(ops.map((o) => o.mediaId).sort()).toEqual(["m1", "m2"]);
  });

  it("linkPublishedPost scenario: new mediaId appears → add op", () => {
    const oldA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [[]],
    });
    const newA = makeAutomation({
      id: "a1",
      targetPostIdsByTrigger: [["freshly_published_media"]],
    });
    const ops = triggerDiff(oldA, newA, profileId);
    expect(ops).toEqual([
      {
        op: "add",
        profileId,
        mediaId: "freshly_published_media",
        automationId: newA._id,
      },
    ]);
  });
});

describe("sessionOp", () => {
  it("new active session → put", () => {
    const s = makeSession({ id: "s1", status: "active" });
    expect(sessionOp(null, s)).toEqual({
      op: "put",
      instagramUserId: "ig_user_1",
      sessionId: "s1",
    });
  });

  it("new completed session → no op (shouldn't ever happen, defensive)", () => {
    const s = makeSession({ id: "s1", status: "completed" });
    expect(sessionOp(null, s)).toBe(null);
  });

  it("active → completed: delete", () => {
    const oldS = makeSession({ id: "s1", status: "active" });
    const newS = makeSession({ id: "s1", status: "completed" });
    expect(sessionOp(oldS, newS)).toEqual({
      op: "delete",
      instagramUserId: "ig_user_1",
    });
  });

  it("active → expired: delete", () => {
    const oldS = makeSession({ id: "s1", status: "active" });
    const newS = makeSession({ id: "s1", status: "expired" });
    expect(sessionOp(oldS, newS)).toEqual({
      op: "delete",
      instagramUserId: "ig_user_1",
    });
  });

  it("completed → active: put (re-activation edge case)", () => {
    const oldS = makeSession({ id: "s1", status: "completed" });
    const newS = makeSession({ id: "s1", status: "active" });
    expect(sessionOp(oldS, newS)).toEqual({
      op: "put",
      instagramUserId: "ig_user_1",
      sessionId: "s1",
    });
  });

  it("active session variables/step changes: no op", () => {
    const oldS = makeSession({ id: "s1", status: "active" });
    const newS = makeSession({ id: "s1", status: "active" });
    expect(sessionOp(oldS, newS)).toBe(null);
  });

  it("hard delete of active session: delete", () => {
    const oldS = makeSession({ id: "s1", status: "active" });
    expect(sessionOp(oldS, null)).toEqual({
      op: "delete",
      instagramUserId: "ig_user_1",
    });
  });

  it("hard delete of non-active session: no op", () => {
    const oldS = makeSession({ id: "s1", status: "completed" });
    expect(sessionOp(oldS, null)).toBe(null);
  });
});
