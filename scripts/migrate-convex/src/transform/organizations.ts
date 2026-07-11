import { MemberId, makeId } from "@delulu/core";
import { epochToDateOr } from "../idmap";
import type {
  LegacyOrganization,
  LegacyOrganizationMember,
  LegacyUser,
} from "../legacy";
import { type TransformContext, TransformFatal } from "./context";
import { COUNTER } from "./counters";
import type { MemberRow } from "./types";

export interface OrgTransformInput {
  readonly orgs: readonly LegacyOrganization[];
  readonly members: readonly LegacyOrganizationMember[];
  /** legacy user `_id` → decoded user (for email + external id). */
  readonly legacyUsersById: ReadonlyMap<string, LegacyUser>;
  /** Clerk user id → legacy user `_id` (creator resolution). */
  readonly legacyUserIdByExternalId: ReadonlyMap<string, string>;
}

type Role = MemberRow["role"];

const mapRole = (legacyRole: string, isCreator: boolean): Role => {
  if (isCreator) {
    return "owner";
  }
  return legacyRole === "org:admin" ? "admin" : "editor";
};

/**
 * organizations → workspaces (clerk linkage kept) + workspace_members with the
 * locked role mapping (creator→owner, admin→admin, else→editor; never viewer).
 * Billing owner = creator, else oldest admin, else oldest member (reported).
 * A creator lacking a membership row gets a synthesized owner member.
 */
export const transformOrganizations = (
  ctx: TransformContext,
  input: OrgTransformInput
): void => {
  const { orgs, members, legacyUsersById, legacyUserIdByExternalId } = input;
  const usedSlugs = new Set<string>();

  const membersByOrg = new Map<string, LegacyOrganizationMember[]>();
  for (const member of members) {
    const list = membersByOrg.get(member.organizationId) ?? [];
    list.push(member);
    membersByOrg.set(member.organizationId, list);
  }
  const oldestFirst = (rows: LegacyOrganizationMember[]) =>
    [...rows].sort(
      (a, b) =>
        (a.joinedAt ?? a._creationTime) - (b.joinedAt ?? b._creationTime)
    );

  for (const org of orgs) {
    const workspaceId = ctx.ids.workspaces.getOrCreate(org._id);
    const orgMembers = oldestFirst(membersByOrg.get(org._id) ?? []);

    // Billing owner resolution (owner column is NOT NULL).
    const creatorLegacyUserId = legacyUserIdByExternalId.get(org.createdBy);
    let billingOwnerUserId = creatorLegacyUserId
      ? ctx.userIdByLegacy.get(creatorLegacyUserId)
      : undefined;
    if (billingOwnerUserId === undefined) {
      const admin = orgMembers.find((m) => m.role === "org:admin");
      const fallback = admin ?? orgMembers[0];
      if (fallback) {
        billingOwnerUserId = ctx.userIdByLegacy.get(fallback.userId);
        ctx.warnings.push(
          `organizations/${org._id}: creator ${org.createdBy} not found; billing owner falls back to ${
            admin ? "oldest admin" : "oldest member"
          } ${fallback.userId}`
        );
      }
    }
    if (billingOwnerUserId === undefined) {
      throw new TransformFatal(
        `organizations/${org._id}: no billing owner could be resolved (no creator, no members)`
      );
    }

    let slug = org.slug ?? null;
    if (slug !== null && usedSlugs.has(slug)) {
      ctx.warnings.push(
        `organizations/${org._id}: duplicate slug "${slug}" nulled to preserve uniqueness`
      );
      ctx.counters.bump(COUNTER.workspacesSlugNulled);
      slug = null;
    }
    if (slug !== null) {
      usedSlugs.add(slug);
    }

    const createdAt = epochToDateOr(
      org.createdAt ?? org._creationTime,
      org._creationTime
    );
    const updatedAt = epochToDateOr(org.updatedAt, org._creationTime);
    ctx.workspaceByClerkOrg.set(org.clerkOrgId, workspaceId);
    ctx.workspaceByOrgConvexId.set(org._id, workspaceId);
    ctx.billingOwnerByWorkspace.set(workspaceId, billingOwnerUserId);
    ctx.load.workspaces.push({
      id: workspaceId,
      legacyConvexId: org._id,
      name: org.name,
      slug,
      billingOwnerUserId,
      parentOrgId: null,
      clerkOrgId: org.clerkOrgId,
      isPersonal: false,
      createdAt,
      updatedAt,
    });

    let creatorHasMembership = false;
    for (const member of orgMembers) {
      const newUserId = ctx.userIdByLegacy.get(member.userId);
      if (newUserId === undefined) {
        ctx.warnings.push(
          `organizationMembers/${member._id}: user ${member.userId} not migrated — member skipped`
        );
        continue;
      }
      const isCreator = member.clerkUserId === org.createdBy;
      if (isCreator) {
        creatorHasMembership = true;
      }
      const newRole = mapRole(member.role, isCreator);
      const memberId = ctx.ids.members.getOrCreate(member._id);
      ctx.setMember(workspaceId, member.userId, memberId);
      if (newRole === "owner") {
        ctx.ownerMemberByWorkspace.set(workspaceId, memberId);
      }
      const mCreated = epochToDateOr(
        member.joinedAt ?? member._creationTime,
        member._creationTime
      );
      ctx.load.workspaceMembers.push({
        id: memberId,
        legacyConvexId: member._id,
        workspaceId,
        userId: newUserId,
        role: newRole,
        createdAt: mCreated,
        updatedAt: epochToDateOr(member.updatedAt, member._creationTime),
      });
      ctx.roleAudit.push({
        org: org.slug ?? org.clerkOrgId,
        email: legacyUsersById.get(member.userId)?.email ?? "<unknown>",
        legacyRole: member.role,
        isCreator,
        newRole,
        anomaly: null,
      });
    }

    // Creator without a membership row → synthesize owner member.
    if (!creatorHasMembership && creatorLegacyUserId) {
      const newUserId = ctx.userIdByLegacy.get(creatorLegacyUserId);
      if (
        newUserId !== undefined &&
        ctx.memberFor(workspaceId, creatorLegacyUserId) === undefined
      ) {
        const memberId = makeId(MemberId);
        ctx.setMember(workspaceId, creatorLegacyUserId, memberId);
        ctx.ownerMemberByWorkspace.set(workspaceId, memberId);
        ctx.counters.bump(COUNTER.membersSynthesizedOwner);
        ctx.load.workspaceMembers.push({
          id: memberId,
          legacyConvexId: null,
          workspaceId,
          userId: newUserId,
          role: "owner",
          createdAt,
          updatedAt,
        });
        ctx.roleAudit.push({
          org: org.slug ?? org.clerkOrgId,
          email: legacyUsersById.get(creatorLegacyUserId)?.email ?? "<unknown>",
          legacyRole: "(none)",
          isCreator: true,
          newRole: "owner",
          anomaly: "creator had no membership row — synthesized owner",
        });
      }
    }
  }
};
