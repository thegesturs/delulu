import type { AuthContext } from "./auth";

/**
 * Permission helpers based on org role.
 *
 * Roles: org:admin, org:editor, org:member, org:viewer
 * Personal workspace (no org) has full access.
 *
 * Only admins can publish directly and approve/reject posts.
 * Editors and members must submit posts for approval.
 */

export function canPublishDirectly(authCtx: AuthContext): boolean {
  if (authCtx.isPersonal) {
    return true;
  }
  return authCtx.orgRole === "org:admin";
}

export function canCreatePosts(authCtx: AuthContext): boolean {
  if (authCtx.isPersonal) {
    return true;
  }
  return (
    authCtx.orgRole === "org:admin" ||
    authCtx.orgRole === "org:editor" ||
    authCtx.orgRole === "org:member"
  );
}

export function canApprove(authCtx: AuthContext): boolean {
  return authCtx.orgRole === "org:admin";
}

export function canManageSocials(authCtx: AuthContext): boolean {
  if (authCtx.isPersonal) {
    return true;
  }
  return authCtx.orgRole === "org:admin" || authCtx.orgRole === "org:editor";
}

export function canManageMembers(authCtx: AuthContext): boolean {
  if (authCtx.isPersonal) {
    return true;
  }
  return authCtx.orgRole === "org:admin";
}

export function isViewer(authCtx: AuthContext): boolean {
  return authCtx.orgRole === "org:viewer";
}

export function requiresApproval(authCtx: AuthContext): boolean {
  if (authCtx.isPersonal) {
    return false;
  }
  return authCtx.orgRole === "org:editor" || authCtx.orgRole === "org:member";
}

export function assertCanPublish(authCtx: AuthContext): void {
  if (isViewer(authCtx)) {
    throw new Error("Viewers cannot publish posts");
  }
  if (requiresApproval(authCtx)) {
    throw new Error("Posts must be submitted for approval");
  }
}

export function assertCanApprove(authCtx: AuthContext): void {
  if (!canApprove(authCtx)) {
    throw new Error("Only admins can approve posts");
  }
}
