import { TableAggregate } from "@convex-dev/aggregate";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthContext } from "./lib/auth";
import { getCurrentUser } from "./users";
import { getCurrentTimestamp } from "./utils";

// ============================================================================
// STREAK CALCULATION FUNCTIONS
// ============================================================================

// Helper function to calculate streak from publish dates array
export function calculateStreak(publishDates: number[] = []): {
  current: number;
  longest: number;
} {
  if (publishDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Convert timestamps to date strings (YYYY-MM-DD) for day-based comparison
  const uniqueDates = Array.from(
    new Set(
      publishDates.map((timestamp) => {
        const date = new Date(timestamp);
        return date.toISOString().split("T")[0]; // Get YYYY-MM-DD
      })
    )
  ).sort(); // Sort chronologically

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Calculate longest streak by checking consecutive dates
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const prevDate = new Date(uniqueDates[i - 1]);
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayDiff === 1) {
      // Consecutive day
      tempStreak++;
    } else {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (from most recent date backwards)
  const latestDate = uniqueDates.at(-1);

  // Current streak only counts if they posted today or yesterday
  if (latestDate === today || latestDate === yesterday) {
    currentStreak = 1;

    // Count backwards from latest date
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(uniqueDates[i + 1]);
      const prevDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }
  } else {
    currentStreak = 0; // No recent activity
  }

  return { current: currentStreak, longest: longestStreak };
}

// Mutation to add a publish date to user's streak array
export const addPublishDate = mutation({
  args: {
    userId: v.id("users"),
    publishDate: v.optional(v.number()), // Optional, defaults to now
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const publishDate = args.publishDate || Date.now();
    const dateStr = new Date(publishDate).toISOString().split("T")[0];

    // Get existing publish dates or initialize empty array
    const existingDates = user.stats?.publishDates || [];

    // Check if this date already exists (convert to date strings for comparison)
    const existingDateStrs = existingDates.map(
      (timestamp) => new Date(timestamp).toISOString().split("T")[0]
    );

    if (!existingDateStrs.includes(dateStr)) {
      // Add the new date
      const updatedDates = [...existingDates, publishDate];

      await ctx.db.patch(args.userId, {
        stats: {
          ...user.stats,
          publishDates: updatedDates,
        },
        updatedAt: getCurrentTimestamp(),
      });
    }
  },
});

// Internal mutation to add a publish date to user's streak array
export const addPublishDateInternal = internalMutation({
  args: {
    userId: v.id("users"),
    publishDate: v.optional(v.number()), // Optional, defaults to now
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const publishDate = args.publishDate || Date.now();
    const dateStr = new Date(publishDate).toISOString().split("T")[0];

    // Get existing publish dates or initialize empty array
    const existingDates = user.stats?.publishDates || [];

    // Check if this date already exists (convert to date strings for comparison)
    const existingDateStrs = existingDates.map(
      (timestamp) => new Date(timestamp).toISOString().split("T")[0]
    );

    if (!existingDateStrs.includes(dateStr)) {
      // Add the new date
      const updatedDates = [...existingDates, publishDate];

      await ctx.db.patch(args.userId, {
        stats: {
          ...user.stats,
          publishDates: updatedDates,
        },
        updatedAt: getCurrentTimestamp(),
      });
    }
  },
});

// Query to get user's streak stats
export const getUserStreakStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let user: Doc<"users"> | null = null;

    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else {
      user = await getCurrentUser(ctx);
    }

    if (!user) {
      return { current: 0, longest: 0 };
    }

    const publishDates = user.stats?.publishDates || [];
    return calculateStreak(publishDates);
  },
});

// ============================================================================
// AGGREGATES
// ============================================================================

// Aggregate for posts by user and status — personal workspace only
// For org context, we use direct indexed queries (bounded by org size)
export const postsByUserStatus = new TableAggregate<{
  Key: [Id<"users"> | null, string]; // [userId, status]
  DataModel: DataModel;
  TableName: "posts";
}>(components.postsByUserStatus, {
  sortKey: (doc) => [doc.userId ?? null, doc.status],
});

// Aggregate for posts by org and status — mirrors postsByUserStatus for org workspaces.
// Lets getDashboardStats avoid .collect() + JS filter on large org post tables.
export const postsByOrgStatus = new TableAggregate<{
  Key: [string | null, string]; // [organizationId, status]
  DataModel: DataModel;
  TableName: "posts";
}>(components.postsByOrgStatus, {
  sortKey: (doc) => [doc.organizationId ?? null, doc.status],
});

// Dual-aggregate helpers — call these instead of the individual aggregators
// so we always keep both in sync. Every post mutation should flow through one
// of these four functions.
export async function insertPostAggregate(
  ctx: Parameters<typeof postsByUserStatus.insert>[0],
  post: Doc<"posts">
) {
  await postsByUserStatus.insert(ctx, post);
  await postsByOrgStatus.insert(ctx, post);
}
export async function replacePostAggregate(
  ctx: Parameters<typeof postsByUserStatus.replace>[0],
  oldPost: Doc<"posts">,
  newPost: Doc<"posts">
) {
  await postsByUserStatus.replace(ctx, oldPost, newPost);
  await postsByOrgStatus.replace(ctx, oldPost, newPost);
}
export async function deletePostAggregate(
  ctx: Parameters<typeof postsByUserStatus.delete>[0],
  post: Doc<"posts">
) {
  await postsByUserStatus.delete(ctx, post);
  await postsByOrgStatus.delete(ctx, post);
}
export async function insertPostAggregateIfAbsent(
  ctx: Parameters<typeof postsByUserStatus.insertIfDoesNotExist>[0],
  post: Doc<"posts">
) {
  await postsByUserStatus.insertIfDoesNotExist(ctx, post);
  await postsByOrgStatus.insertIfDoesNotExist(ctx, post);
}
export async function clearPostAggregates(
  ctx: Parameters<typeof postsByUserStatus.clear>[0]
) {
  await postsByUserStatus.clear(ctx);
  await postsByOrgStatus.clear(ctx);
}

// Query to get comprehensive dashboard stats (org-aware)
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return {
        totalPosts: 0,
        publishedCount: 0,
        scheduledCount: 0,
        failedCount: 0,
        savedCount: 0,
        processingCount: 0,
        upcomingPosts: 0,
        thisWeekPosts: 0,
        lastWeekPosts: 0,
        successRate: 0,
        connectedAccounts: 0,
        expiredTokens: 0,
        postingStreak: 0,
        longestStreak: 0,
      };
    }

    const orgId = authCtx.organizationId;

    // Status counts via aggregator — no full-table scan, O(log n) reads.
    // Branches kept separate so TS picks the right (non-namespaced) overload.
    const [
      totalPosts,
      publishedCount,
      scheduledCount,
      failedCount,
      savedCount,
      processingCount,
    ] = orgId
      ? await Promise.all([
          postsByOrgStatus.count(ctx, { bounds: { prefix: [orgId] } }),
          postsByOrgStatus.count(ctx, {
            bounds: { prefix: [orgId, "PUBLISHED"] },
          }),
          postsByOrgStatus.count(ctx, {
            bounds: { prefix: [orgId, "SCHEDULED"] },
          }),
          postsByOrgStatus.count(ctx, {
            bounds: { prefix: [orgId, "FAILED"] },
          }),
          postsByOrgStatus.count(ctx, {
            bounds: { prefix: [orgId, "SAVED"] },
          }),
          postsByOrgStatus.count(ctx, {
            bounds: { prefix: [orgId, "PROCESSING"] },
          }),
        ])
      : await Promise.all([
          postsByUserStatus.count(ctx, {
            bounds: { prefix: [authCtx.userId] },
          }),
          postsByUserStatus.count(ctx, {
            bounds: { prefix: [authCtx.userId, "PUBLISHED"] },
          }),
          postsByUserStatus.count(ctx, {
            bounds: { prefix: [authCtx.userId, "SCHEDULED"] },
          }),
          postsByUserStatus.count(ctx, {
            bounds: { prefix: [authCtx.userId, "FAILED"] },
          }),
          postsByUserStatus.count(ctx, {
            bounds: { prefix: [authCtx.userId, "SAVED"] },
          }),
          postsByUserStatus.count(ctx, {
            bounds: { prefix: [authCtx.userId, "PROCESSING"] },
          }),
        ]);

    // Calculate time ranges
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
    const thisWeekStart = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000;

    // Helper to get posts query for the active context
    const queryPosts = () => {
      if (orgId) {
        return ctx.db
          .query("posts")
          .withIndex("by_organization_id", (q) =>
            q.eq("organizationId", orgId)
          );
      }
      return ctx.db
        .query("posts")
        .withIndex("by_user_id", (q) => q.eq("userId", authCtx.userId));
    };

    // Get upcoming scheduled posts
    // Time-window counts — capped at 500 to bound DB reads. Any org hitting
    // 500 scheduled/weekly posts renders as "500+" which is fine for the UI.
    // (A full fix would add a (owner, scheduledAt) or (owner, createdAt)
    // aggregator, but the cost/benefit isn't there yet.)
    const COUNT_CAP = 500;
    const upcomingScheduledPosts = await queryPosts()
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "SCHEDULED"),
          q.eq(q.field("isDeleted"), false),
          q.gte(q.field("scheduledAt"), now),
          q.lte(q.field("scheduledAt"), nextWeek)
        )
      )
      .take(COUNT_CAP);
    const upcomingPosts = upcomingScheduledPosts.length;

    const thisWeekPostsResult = await queryPosts()
      .filter((q) =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.gte(q.field("createdAt"), thisWeekStart),
          q.lte(q.field("createdAt"), now)
        )
      )
      .take(COUNT_CAP);
    const thisWeekPosts = thisWeekPostsResult.length;

    const lastWeekPostsResult = await queryPosts()
      .filter((q) =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.gte(q.field("createdAt"), lastWeekStart),
          q.lt(q.field("createdAt"), thisWeekStart)
        )
      )
      .take(COUNT_CAP);
    const lastWeekPosts = lastWeekPostsResult.length;

    // Calculate success rate
    const totalAttempted = publishedCount + failedCount;
    const successRate =
      totalAttempted > 0
        ? Math.round((publishedCount / totalAttempted) * 100)
        : 0;

    // Get connected accounts. Capped at 500 for safety — no org should have
    // anywhere near that many socials in practice.
    const socialProviders = orgId
      ? await ctx.db
          .query("socialProviders")
          .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(500)
      : await ctx.db
          .query("socialProviders")
          .withIndex("by_user_id", (q) => q.eq("userId", authCtx.userId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(500);

    // Count expired tokens
    const expiredTokens = socialProviders.filter(
      (sp) => sp.refreshTokenExpiresIn && sp.refreshTokenExpiresIn < now
    ).length;

    // Get streak information
    const user = authCtx.user as Doc<"users">;
    const publishDates = user.stats?.publishDates || [];
    const streakStats = calculateStreak(publishDates);

    return {
      totalPosts,
      publishedCount,
      scheduledCount,
      failedCount,
      savedCount,
      processingCount,
      upcomingPosts,
      thisWeekPosts,
      lastWeekPosts,
      successRate,
      connectedAccounts: socialProviders.length,
      expiredTokens,
      postingStreak: streakStats.current,
      longestStreak: streakStats.longest,
    };
  },
});

// Query to get upcoming scheduled posts with details (org-aware)
export const getUpcomingPosts = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return [];
    }

    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const postsQuery = authCtx.organizationId
      ? ctx.db
          .query("posts")
          .withIndex("by_organization_id", (q) =>
            q.eq("organizationId", authCtx.organizationId)
          )
      : ctx.db
          .query("posts")
          .withIndex("by_user_id", (q) => q.eq("userId", authCtx.userId));

    const upcomingPosts = await postsQuery
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "SCHEDULED"),
          q.eq(q.field("isDeleted"), false),
          q.gte(q.field("scheduledAt"), now),
          q.lte(q.field("scheduledAt"), futureDate)
        )
      )
      .collect();

    // Sort by scheduled time
    upcomingPosts.sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));

    // Enrich with social provider info
    const enrichedPosts = await Promise.all(
      upcomingPosts.map(async (post) => {
        const socialProviders = await Promise.all(
          post.socialProviderIds.map((id) => ctx.db.get(id))
        );

        return {
          ...post,
          socialProviders: socialProviders.filter(Boolean),
        };
      })
    );

    return enrichedPosts;
  },
});

// Query to get failed posts that need attention (org-aware)
export const getFailedPosts = query({
  args: {},
  handler: async (ctx) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return [];
    }

    const postsQuery = authCtx.organizationId
      ? ctx.db
          .query("posts")
          .withIndex("by_organization_id", (q) =>
            q.eq("organizationId", authCtx.organizationId)
          )
      : ctx.db
          .query("posts")
          .withIndex("by_user_status", (q) =>
            q
              .eq("userId", authCtx.userId)
              .eq("status", "FAILED")
              .eq("isDeleted", false)
          );

    const failedPosts = authCtx.organizationId
      ? await postsQuery
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "FAILED"),
              q.eq(q.field("isDeleted"), false)
            )
          )
          .collect()
      : await postsQuery.collect();

    // Sort by most recent first
    failedPosts.sort((a, b) => b.updatedAt - a.updatedAt);

    // Enrich with social provider info
    const enrichedPosts = await Promise.all(
      failedPosts.slice(0, 10).map(async (post) => {
        // Limit to 10 most recent
        const socialProviders = await Promise.all(
          post.socialProviderIds.map((id) => ctx.db.get(id))
        );

        return {
          ...post,
          socialProviders: socialProviders.filter(Boolean),
        };
      })
    );

    return enrichedPosts;
  },
});

// Query to get platform distribution stats (org-aware)
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx) {
      return [];
    }

    const socialProviders = authCtx.organizationId
      ? await ctx.db
          .query("socialProviders")
          .withIndex("by_organization_id", (q) =>
            q.eq("organizationId", authCtx.organizationId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect()
      : await ctx.db
          .query("socialProviders")
          .withIndex("by_user_id", (q) => q.eq("userId", authCtx.userId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

    const platformCounts = socialProviders.reduce(
      (acc, provider) => {
        acc[provider.socialType] = (acc[provider.socialType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      count,
    }));
  },
});
