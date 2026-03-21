import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Auth context that includes the current user and optional organization context.
 * When the user has an active org selected in Clerk, `organizationId` will be the
 * Clerk org ID string (from the JWT `org_id` claim).
 */
export interface AuthContext {
  user: { _id: Id<"users">; [key: string]: unknown };
  userId: Id<"users">;
  /** Clerk org ID when user has an active org selected, undefined for personal workspace */
  organizationId: string | undefined;
  /** User's role in the active org ("org:admin" | "org:member"), undefined for personal */
  orgRole: string | undefined;
  /** Active org's slug, undefined for personal */
  orgSlug: string | undefined;
  isPersonal: boolean;
}

/**
 * Get the current auth context including org info from the Clerk JWT.
 * Returns null if the user is not authenticated or not found in the database.
 */
export async function getAuthContext(
  ctx: QueryCtx
): Promise<AuthContext | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
    .unique();
  if (!user) {
    return null;
  }

  // Clerk includes org claims in the JWT when user has an active org selected
  const claims = identity as Record<string, unknown>;
  const organizationId = claims.org_id as string | undefined;
  const orgRole = claims.org_role as string | undefined;
  const orgSlug = claims.org_slug as string | undefined;

  return {
    user,
    userId: user._id,
    organizationId,
    orgRole,
    orgSlug,
    isPersonal: !organizationId,
  };
}

/**
 * Get the current auth context or throw if not authenticated.
 */
export async function getAuthContextOrThrow(
  ctx: QueryCtx
): Promise<AuthContext> {
  const result = await getAuthContext(ctx);
  if (!result) {
    throw new Error("Unauthorized");
  }
  return result;
}

/**
 * Assert that a user is a member of an organization.
 * Returns the membership record.
 */
export async function assertOrgAccess(
  ctx: QueryCtx,
  clerkOrgId: string,
  userId: Id<"users">
) {
  // First find the organization by clerkOrgId
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", clerkOrgId))
    .unique();
  if (!org) {
    throw new Error("Organization not found");
  }

  const member = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", org._id).eq("userId", userId)
    )
    .unique();
  if (!member) {
    throw new Error("Not a member of this organization");
  }
  return member;
}

/**
 * Resolve the effective plan type for the current context.
 * - Personal workspace: uses the current user's subscription
 * - Org workspace: uses the org creator's (admin's) subscription
 *
 * This means the org admin's plan governs limits for the whole org.
 */
export async function getEffectivePlanOwner(
  ctx: QueryCtx,
  authCtx: AuthContext
): Promise<Doc<"users"> | null> {
  if (authCtx.isPersonal) {
    // Personal workspace — current user owns the plan
    return authCtx.user as Doc<"users">;
  }

  // Org workspace — find the org, then get the creator's user record
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_clerk_org_id", (q) =>
      q.eq("clerkOrgId", authCtx.organizationId!)
    )
    .unique();

  if (!org) {
    return authCtx.user as Doc<"users">; // fallback to current user
  }

  // createdBy is the Clerk user ID of the org creator
  const creator = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", org.createdBy))
    .unique();

  return creator ?? (authCtx.user as Doc<"users">); // fallback to current user
}

/**
 * Get the plan type for the effective plan owner.
 */
export async function getEffectivePlanType(
  ctx: QueryCtx,
  authCtx: AuthContext
): Promise<"FREE" | "ECHO" | "VIBE"> {
  const owner = await getEffectivePlanOwner(ctx, authCtx);
  if (!owner?.subscriptionId) {
    return "FREE";
  }

  const subscription = await ctx.db.get(owner.subscriptionId);
  if (subscription && subscription.status === "ACTIVE") {
    return subscription.planType;
  }
  return "FREE";
}
