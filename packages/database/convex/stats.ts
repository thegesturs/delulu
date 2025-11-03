import { TableAggregate } from '@convex-dev/aggregate';
import { v } from 'convex/values';
import { components } from './_generated/api';
import type { DataModel, Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import { getCurrentUser } from './users';
import { getCurrentTimestamp } from './utils';

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
        return date.toISOString().split('T')[0]; // Get YYYY-MM-DD
      })
    )
  ).sort(); // Sort chronologically

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

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
    userId: v.id('users'),
    publishDate: v.optional(v.number()), // Optional, defaults to now
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const publishDate = args.publishDate || Date.now();
    const dateStr = new Date(publishDate).toISOString().split('T')[0];

    // Get existing publish dates or initialize empty array
    const existingDates = user.stats?.publishDates || [];

    // Check if this date already exists (convert to date strings for comparison)
    const existingDateStrs = existingDates.map(
      (timestamp) => new Date(timestamp).toISOString().split('T')[0]
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
    userId: v.id('users'),
    publishDate: v.optional(v.number()), // Optional, defaults to now
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const publishDate = args.publishDate || Date.now();
    const dateStr = new Date(publishDate).toISOString().split('T')[0];

    // Get existing publish dates or initialize empty array
    const existingDates = user.stats?.publishDates || [];

    // Check if this date already exists (convert to date strings for comparison)
    const existingDateStrs = existingDates.map(
      (timestamp) => new Date(timestamp).toISOString().split('T')[0]
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
  args: { userId: v.optional(v.id('users')) },
  handler: async (ctx, args) => {
    let user: Doc<'users'> | null = null;

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

// Aggregate for posts by user and status - enables user-specific status filtering
export const postsByUserStatus = new TableAggregate<{
  Key: [Id<'users'> | null, string]; // [userId, status]
  DataModel: DataModel;
  TableName: 'posts';
}>(components.postsByUserStatus, {
  sortKey: (doc) => [doc.userId ?? null, doc.status],
});

// Query to get comprehensive dashboard stats
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

    // Get total posts for user using aggregator
    const totalPosts = await postsByUserStatus.count(ctx, {
      bounds: {
        prefix: [user._id],
      },
    });

    // Get counts by specific status using aggregator
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

    const processingCount = await postsByUserStatus.count(ctx, {
      bounds: { prefix: [user._id, 'PROCESSING'] },
    });

    // Calculate time ranges
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;
    const thisWeekStart = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000;

    // Get upcoming scheduled posts using direct query (more accurate than aggregator)
    const upcomingScheduledPosts = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'SCHEDULED'),
          q.eq(q.field('isDeleted'), false),
          q.gte(q.field('scheduledAt'), now),
          q.lte(q.field('scheduledAt'), nextWeek)
        )
      )
      .collect();
    const upcomingPosts = upcomingScheduledPosts.length;

    // Get weekly trends using direct queries
    const thisWeekPostsResult = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('isDeleted'), false),
          q.gte(q.field('createdAt'), thisWeekStart),
          q.lte(q.field('createdAt'), now)
        )
      )
      .collect();
    const thisWeekPosts = thisWeekPostsResult.length;

    const lastWeekPostsResult = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('isDeleted'), false),
          q.gte(q.field('createdAt'), lastWeekStart),
          q.lt(q.field('createdAt'), thisWeekStart)
        )
      )
      .collect();
    const lastWeekPosts = lastWeekPostsResult.length;

    // Calculate success rate
    const totalAttempted = publishedCount + failedCount;
    const successRate =
      totalAttempted > 0
        ? Math.round((publishedCount / totalAttempted) * 100)
        : 0;

    // Get connected accounts count
    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Count expired tokens
    const expiredTokens = socialProviders.filter(
      (sp) => sp.refreshTokenExpiresIn && sp.refreshTokenExpiresIn < now
    ).length;

    // Get streak information using new streak system
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

// Query to get upcoming scheduled posts with details
export const getUpcomingPosts = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

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
    if (!user) {
      return [];
    }

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
    if (!user) {
      return [];
    }

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
