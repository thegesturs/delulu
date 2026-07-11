import { type TransformContext, TransformFatal } from "./context";
import type { OwnershipAuditRow } from "./types";

export interface OwnershipInput {
  /** Clerk org id as stored on legacy providers/media/posts/automations. */
  readonly organizationId?: string | null;
  /** Legacy user `_id`. */
  readonly userId?: string | null;
  readonly entity: string;
  readonly legacyId: string;
}

export interface ResolvedOwnership {
  readonly workspaceId: string;
  readonly kind: "org" | "user";
  readonly resolvedVia: string;
}

/**
 * Pure ownership resolution (spec §4.6). `organizationId` set → the org's
 * workspace; else `userId` → that user's personal workspace; else fatal. Zero
 * fallthrough to a default. Does NOT record the audit — call `recordOwnership`
 * when the owning row is actually emitted so audits never reference dropped rows.
 */
export const computeWorkspace = (
  ctx: TransformContext,
  input: OwnershipInput
): ResolvedOwnership => {
  const org = input.organizationId;
  if (org !== undefined && org !== null && org !== "") {
    const workspaceId = ctx.workspaceByClerkOrg.get(org);
    if (workspaceId === undefined) {
      throw new TransformFatal(
        `${input.entity}/${input.legacyId}: organizationId ${org} resolves to no workspace (unknown org)`
      );
    }
    return { workspaceId, kind: "org", resolvedVia: `clerkOrgId=${org}` };
  }

  const user = input.userId;
  if (user !== undefined && user !== null && user !== "") {
    const workspaceId = ctx.personalWorkspaceByUser.get(user);
    if (workspaceId === undefined) {
      throw new TransformFatal(
        `${input.entity}/${input.legacyId}: userId ${user} resolves to no personal workspace`
      );
    }
    return { workspaceId, kind: "user", resolvedVia: `userId=${user}` };
  }

  throw new TransformFatal(
    `${input.entity}/${input.legacyId}: neither organizationId nor userId set — cannot resolve ownership`
  );
};

export const recordOwnership = (
  ctx: TransformContext,
  row: OwnershipAuditRow
): void => {
  ctx.ownershipAudit.push(row);
};

/** Resolve + record in one step (the common case). */
export const resolveWorkspace = (
  ctx: TransformContext,
  input: OwnershipInput
): string => {
  const resolved = computeWorkspace(ctx, input);
  recordOwnership(ctx, {
    entity: input.entity,
    legacyId: input.legacyId,
    kind: resolved.kind,
    workspaceId: resolved.workspaceId,
    resolvedVia: resolved.resolvedVia,
  });
  return resolved.workspaceId;
};
