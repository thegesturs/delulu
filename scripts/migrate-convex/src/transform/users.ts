import { MemberId, makeId, WorkspaceId } from "@delulu/core";
import { epochToDate, epochToDateOr } from "../idmap";
import type { LegacyUser } from "../legacy";
import { type TransformContext, TransformFatal } from "./context";
import { COUNTER } from "./counters";

/**
 * Identity spine: one user row + a synthesized personal workspace (#146) with an
 * owner member. Usage counters carry over into the pooled user columns (§4.5).
 * A missing `externalId` is a hard failure — those users must not exist.
 */
export const transformUsers = (
  ctx: TransformContext,
  users: readonly LegacyUser[]
): void => {
  for (const user of users) {
    if (user.externalId === undefined || user.externalId === "") {
      throw new TransformFatal(
        `users/${user._id}: externalId is missing — every user must have a Clerk id (spec §4.4). Inspect the source document.`
      );
    }

    const userId = ctx.ids.users.getOrCreate(user._id);
    ctx.userIdByLegacy.set(user._id, userId);
    const createdAt = epochToDateOr(user._creationTime, user._creationTime);
    const updatedAt = epochToDateOr(user.updatedAt, user._creationTime);
    const usage = user.usage ?? {};

    ctx.load.users.push({
      id: userId,
      legacyConvexId: user._id,
      externalId: user.externalId,
      email: user.email ?? null,
      name: user.name ?? null,
      imageUrl: user.image ?? null,
      monthlyPosts: usage.monthlyPosts ?? 0,
      monthlyPostsPeriodStart: epochToDate(usage.monthlyPostsPeriodStart),
      dmsSent: usage.dmsSent ?? 0,
      dmsSentPeriodStart: null,
      transcriptionsUsed: usage.transcriptionsUsed ?? 0,
      transcriptionsPeriodStart: epochToDate(usage.transcriptionPeriodStart),
      createdAt,
      updatedAt,
    });

    // Personal workspace — synthesized, so it has no legacy_convex_id.
    const workspaceId = makeId(WorkspaceId);
    ctx.personalWorkspaceByUser.set(user._id, workspaceId);
    ctx.billingOwnerByWorkspace.set(workspaceId, userId);
    ctx.counters.bump(COUNTER.workspacesPersonalSynthesized);
    ctx.load.workspaces.push({
      id: workspaceId,
      legacyConvexId: null,
      name:
        user.name && user.name.length > 0
          ? `${user.name}'s workspace`
          : "Personal workspace",
      slug: null,
      billingOwnerUserId: userId,
      parentOrgId: null,
      clerkOrgId: null,
      isPersonal: true,
      createdAt,
      updatedAt,
    });

    // Owner member.
    const memberId = makeId(MemberId);
    ctx.setMember(workspaceId, user._id, memberId);
    ctx.ownerMemberByWorkspace.set(workspaceId, memberId);
    ctx.load.workspaceMembers.push({
      id: memberId,
      legacyConvexId: null,
      workspaceId,
      userId,
      role: "owner",
      createdAt,
      updatedAt,
    });
  }
};
