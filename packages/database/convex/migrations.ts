import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { getCurrentTimestamp } from "./utils";

/**
 * One-time backfill migration: compute usage counters from actual data.
 *
 * Run after deploying the schema + code changes:
 *   npx convex run migrations:backfillUsageCounters
 */
export const backfillUsageCounters = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const monthStart = new Date(
      new Date(now).getFullYear(),
      new Date(now).getMonth(),
      1
    ).getTime();

    let updatedCount = 0;

    for (const user of users) {
      // Count active social providers
      const socialProviders = await ctx.db
        .query("socialProviders")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Count non-deleted posts this month
      const postsThisMonth = await ctx.db
        .query("posts")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("createdAt"), monthStart),
            q.eq(q.field("isDeleted"), false)
          )
        )
        .collect();

      // Sum media bytes
      const mediaFiles = await ctx.db
        .query("media")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();

      const totalBytes = mediaFiles.reduce(
        (sum, media) => sum + (media.size ?? 0),
        0
      );

      await ctx.db.patch(user._id, {
        usage: {
          ...user.usage,
          socialAccounts: socialProviders.length,
          monthlyPosts: postsThisMonth.length,
          monthlyPostsPeriodStart: monthStart,
          mediaStorageBytes: totalBytes,
        },
        updatedAt: getCurrentTimestamp(),
      });

      updatedCount++;
    }

    return updatedCount;
  },
});
