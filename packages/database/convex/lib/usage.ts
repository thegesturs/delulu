import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentTimestamp } from "../utils";
import { type AuthContext, getEffectivePlanOwner } from "./auth";

/** Fields on user.usage that can be adjusted atomically. */
type UsageField = "socialAccounts" | "monthlyPosts" | "mediaStorageBytes";

/**
 * Atomically adjust a single counter on a user doc.
 * Clamps to 0 minimum so counters never go negative.
 */
export async function adjustUsage(
  ctx: MutationCtx,
  userId: Id<"users"> | null,
  field: UsageField,
  delta: number
) {
  if (!userId) {
    return;
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    return;
  }

  const current =
    (user.usage as Record<string, number | undefined>)[field] ?? 0;
  const next = Math.max(0, current + delta);

  await ctx.db.patch(userId, {
    usage: { ...user.usage, [field]: next },
    updatedAt: getCurrentTimestamp(),
  });
}

/**
 * Resolve who "owns" the usage counters for the current auth context.
 * - Personal workspace → current user's ID
 * - Org workspace → org creator's user ID (plan owner)
 */
export async function getUsageOwnerId(
  ctx: QueryCtx,
  authCtx: AuthContext
): Promise<Id<"users">> {
  const owner = await getEffectivePlanOwner(ctx, authCtx);
  return owner?._id ?? authCtx.userId;
}

/**
 * Resolve the usage owner from a document that may have an organizationId.
 * Used by core helpers (like softDeletePostCore) that don't have authCtx.
 */
export async function resolveUsageOwnerFromDoc(
  ctx: QueryCtx,
  doc: { userId?: Id<"users">; organizationId?: string }
): Promise<Id<"users"> | null> {
  if (!doc.organizationId) {
    return doc.userId ?? null;
  }

  // Find the org by its Clerk org ID
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_clerk_org_id", (q) =>
      q.eq("clerkOrgId", doc.organizationId!)
    )
    .unique();

  if (!org) {
    return doc.userId ?? null;
  }

  // Get the org creator's user record
  const creator = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", org.createdBy))
    .unique();

  return creator?._id ?? doc.userId ?? null;
}
