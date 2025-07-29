import { TableAggregate } from '@convex-dev/aggregate';
import { v } from 'convex/values';
import { components } from './_generated/api';
import type { DataModel, Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { getCurrentUser } from './users';

// Aggregate for posts by user and status - enables user-specific status filtering
export const postsByUserStatus = new TableAggregate<{
  Key: [Id<'users'> | null, string]; // [userId, status]
  DataModel: DataModel;
  TableName: 'posts';
}>(components.postsByUserStatus, {
  sortKey: (doc) => [doc.userId ?? null, doc.status],
});

// Aggregate for posts by user and creation time - enables time-based trends
export const postsByUserTime = new TableAggregate<{
  Key: [Id<'users'> | null, number]; // [userId, createdAt]
  DataModel: DataModel;
  TableName: 'posts';
}>(components.postsByUserTime, {
  sortKey: (doc) => [doc.userId ?? null, doc.createdAt],
});

// Aggregate for posts by user and scheduled time - enables upcoming posts
export const postsByUserSchedule = new TableAggregate<{
  Key: [Id<'users'> | null, number]; // [userId, scheduledAt]
  DataModel: DataModel;
  TableName: 'posts';
}>(components.postsByUserSchedule, {
  sortKey: (doc) => [doc.userId ?? null, doc.scheduledAt || 0],
});

// Query to get comprehensive dashboard stats using compound key aggregates
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        totalPosts: 0,
        publishedCount: 0,
        scheduledCount: 0,
        failedCount: 0,
        savedCount: 0,
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

    // Get total posts for user using prefix
    const totalPosts = await postsByUserStatus.count(ctx, {
      bounds: {
        prefix: [user._id],
      },
    });

    // Get counts by specific status using full key
    const publishedCount = await postsByUserStatus.count(ctx, {
      bounds: { prefix: [user._id, 'PUBLISHED'] },
    });

    const scheduledCount = await postsByUserStatus.count(ctx, {
      bounds: { prefix: [user._id, 'SCHEDULED'] },
    });

    const failedCount = await postsByUserStatus.count(ctx, {
      bounds: { prefix: [user._id, 'FAILED'] },
    });

    const savedCount = await postsByUserStatus.count(ctx, {
      bounds: { prefix: [user._id, 'SAVED'] },
    });

    // Calculate time ranges
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
    const thisWeekStart = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000;

    // Get upcoming scheduled posts using time bounds with user prefix
    const upcomingPosts = await postsByUserSchedule.count(ctx, {
      bounds: {
        prefix: [user._id],
        lower: { key: [user._id, now], inclusive: true },
        upper: { key: [user._id, nextWeek], inclusive: true },
      },
    });

    // Get weekly trends using creation time bounds with user prefix
    const thisWeekPosts = await postsByUserTime.count(ctx, {
      bounds: {
        prefix: [user._id],
        lower: { key: [user._id, thisWeekStart], inclusive: true },
        upper: { key: [user._id, now], inclusive: true },
      },
    });

    const lastWeekPosts = await postsByUserTime.count(ctx, {
      bounds: {
        prefix: [user._id],
        lower: { key: [user._id, lastWeekStart], inclusive: true },
        upper: { key: [user._id, thisWeekStart], inclusive: false },
      },
    });

    // Calculate success rate
    const totalAttempted = publishedCount + failedCount;
    const successRate =
      totalAttempted > 0
        ? Math.round((publishedCount / totalAttempted) * 100)
        : 0;

    // Get connected accounts count (keep simple query for social providers)
    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Count expired tokens
    const expiredTokens = socialProviders.filter(
      (sp) => sp.expiresIn && sp.expiresIn < now
    ).length;

    // Get streak information from user stats
    const postingStreak = user.stats?.streak?.current ?? 0;
    const longestStreak = user.stats?.streak?.longest.count ?? 0;

    return {
      totalPosts,
      publishedCount,
      scheduledCount,
      failedCount,
      savedCount,
      upcomingPosts,
      thisWeekPosts,
      lastWeekPosts,
      successRate,
      connectedAccounts: socialProviders.length,
      expiredTokens,
      postingStreak,
      longestStreak,
    };
  },
});

// Query to get upcoming scheduled posts with details
export const getUpcomingPosts = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const upcomingPosts = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'SCHEDULED'),
          q.eq(q.field('isDeleted'), false),
          q.gte(q.field('scheduledAt'), now),
          q.lte(q.field('scheduledAt'), futureDate)
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

// Query to get failed posts that need attention
export const getFailedPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const failedPosts = await ctx.db
      .query('posts')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', user._id).eq('status', 'FAILED').eq('isDeleted', false)
      )
      .collect();

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

// Query to get platform distribution stats
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isActive'), true))
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
