import type { UserJSON } from "@clerk/backend";
import { type Validator, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { userSchema } from "./schemas";
import { deletePostAggregate } from "./stats";
import { getCurrentTimestamp, isValidEmail } from "./utils";

// User queries
export const getUserById = query({
  args: { id: v.id("users") },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    return user;
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();
    return user;
  },
});
export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    if (!isValidEmail(args.email)) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    return user;
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Delete user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.id))
      .collect();

    for (const post of posts) {
      await deletePostAggregate(ctx, post);
      await ctx.db.delete(post._id);
    }

    // Delete user's social providers
    const socialProviders = await ctx.db
      .query("socialProviders")
      .withIndex("by_user_id", (q) => q.eq("userId", args.id))
      .collect();

    for (const provider of socialProviders) {
      await ctx.db.delete(provider._id);
    }

    // Delete user's media
    const media = await ctx.db
      .query("media")
      .withIndex("by_user_id", (q) => q.eq("userId", args.id))
      .collect();

    for (const mediaItem of media) {
      await ctx.db.delete(mediaItem._id);
    }

    // Finally, delete the user
    await ctx.db.delete(user._id);

    return true;
  },
});

// User usage queries and mutations
export const getUserUsage = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      socialAccounts: v.number(),
      monthlyPosts: v.number(),
      mediaStorageBytes: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", args.id))
      .unique();

    if (!user) {
      return null;
    }

    return {
      socialAccounts: user.usage.socialAccounts,
      monthlyPosts: user.usage.monthlyPosts ?? 0,
      mediaStorageBytes: user.usage.mediaStorageBytes ?? 0,
    };
  },
});

// ============================================================================
// CLERK INTEGRATION FUNCTIONS
// ============================================================================

// Get current user from Clerk identity
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Internal mutation to upsert user from Clerk webhook
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
      email: data.email_addresses?.[0]?.email_address || "",
      externalId: data.id,
      emailVerified:
        data.email_addresses?.[0]?.verification?.status === "verified",
      image: data.image_url || undefined,
      usage: {
        socialAccounts: 0,
        monthlyPosts: 0,
        monthlyPostsPeriodStart: Date.now(),
        mediaStorageBytes: 0,
      },
      updatedAt: getCurrentTimestamp(),
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      // Create new user
      await ctx.db.insert("users", userAttributes);
    } else {
      // Update existing user
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

// Internal mutation to delete user from Clerk webhook
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user === null) {
      // Log warning - user not found for deletion
      throw new Error(`User not found for Clerk user ID: ${clerkUserId}`);
    }
    // Use existing deleteUser logic for cascade delete
    await deleteUserInternal(ctx, user._id);
  },
});

// Helper to get current user or throw
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) {
    throw new Error("Can't get current user");
  }
  return userRecord;
}

// Helper to get current user from Clerk identity
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  console.log(">>> Identity", identity);
  if (identity === null) {
    return null;
  }
  console.log(">>> Subject", identity.subject);
  return await userByExternalId(ctx, identity.subject);
}

// Helper to find user by Clerk external ID
async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique();
}

// Internal helper for cascading user deletion
async function deleteUserInternal(ctx: MutationCtx, userId: Id<"users">) {
  // Delete user's posts
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();

  for (const post of posts) {
    await ctx.db.delete(post._id);
  }

  // Delete user's social providers
  const socialProviders = await ctx.db
    .query("socialProviders")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();

  for (const provider of socialProviders) {
    await ctx.db.delete(provider._id);
  }

  // Delete user's media
  const media = await ctx.db
    .query("media")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();

  for (const mediaItem of media) {
    await ctx.db.delete(mediaItem._id);
  }

  // Finally, delete the user
  await ctx.db.delete(userId);
}

// ============================================================================
// Internal Queries (for Dodo Payments integration)
// ============================================================================

/**
 * Internal query to get user by external ID (Clerk auth ID)
 * Used by Dodo Payments identify function
 */
export const getByExternalId = internalQuery({
  args: { externalId: v.string() },
  returns: v.union(userSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique();
    return user;
  },
});
