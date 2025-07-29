import { v } from 'convex/values';
import { internal } from '../_generated/api';
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../_generated/server';

// Helper type for streak data
type StreakData = {
  current: number;
  lastCountedDate: number;
  longest: {
    count: number;
    startDate: number;
    endDate: number;
  };
  lastCheckedDate: number;
  publishedToday: boolean;
  lastMaintenanceRun: number;
  maintenanceStatus: 'success' | 'pending' | 'failed';
};

// Initialize default streak data
const initializeStreak = (currentTime: number): StreakData => ({
  current: 0,
  lastCountedDate: currentTime,
  longest: {
    count: 0,
    startDate: currentTime,
    endDate: currentTime,
  },
  lastCheckedDate: currentTime,
  publishedToday: false,
  lastMaintenanceRun: currentTime,
  maintenanceStatus: 'pending',
});

// Process a batch of users for streak maintenance
export const processStreaksBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    currentTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Get a batch of users with pagination
    const batch = await ctx.db
      .query('users')
      .paginate({ cursor: args.cursor ?? null, numItems: 500 });

    // Process each user in the batch
    for (const user of batch.page) {
      // Initialize stats if they don't exist
      const stats = {
        streak: user.stats?.streak ?? initializeStreak(args.currentTime),
      };

      const today = new Date(args.currentTime);
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const lastCountedDate = new Date(stats.streak.lastCountedDate);
      lastCountedDate.setHours(0, 0, 0, 0);
      const lastCountedTimestamp = lastCountedDate.getTime();

      // Check if we need to reset streak (no post today and more than a day since last post)
      if (
        !stats.streak.publishedToday &&
        todayTimestamp - lastCountedTimestamp > 24 * 60 * 60 * 1000
      ) {
        // Update longest streak if current streak was longer
        if (stats.streak.current > stats.streak.longest.count) {
          stats.streak.longest = {
            count: stats.streak.current,
            startDate:
              stats.streak.lastCountedDate -
              (stats.streak.current - 1) * 24 * 60 * 60 * 1000,
            endDate: stats.streak.lastCountedDate,
          };
        }
        // Reset streak
        stats.streak.current = 0;
        stats.streak.lastCountedDate = todayTimestamp;
      }

      // Update maintenance status
      stats.streak.lastMaintenanceRun = args.currentTime;
      stats.streak.maintenanceStatus = 'success';
      stats.streak.lastCheckedDate = args.currentTime;
      stats.streak.publishedToday = false; // Reset for next day

      // Update user stats
      await ctx.db.patch(user._id, { stats });
    }

    // Schedule next batch if not done
    if (!batch.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.streak.maintenance.processStreaksBatch,
        {
          cursor: batch.continueCursor,
          currentTime: args.currentTime,
        }
      );
    }
  },
});

// Record maintenance run status
export const recordMaintenanceRun = internalMutation({
  args: {
    status: v.union(
      v.literal('success'),
      v.literal('pending'),
      v.literal('failed')
    ),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(
      `Streak maintenance run completed with status: ${args.status} at ${new Date(args.timestamp).toISOString()}`
    );
  },
});

// Main streak maintenance function that kicks off the batch processing
export const maintainStreaks = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Start the first batch
      await ctx.runMutation(internal.streak.maintenance.processStreaksBatch, {
        currentTime: Date.now(),
      });

      // Record successful start
      await ctx.runMutation(internal.streak.maintenance.recordMaintenanceRun, {
        status: 'success',
        timestamp: Date.now(),
      });
    } catch (error) {
      // Record failed run
      await ctx.runMutation(internal.streak.maintenance.recordMaintenanceRun, {
        status: 'failed',
        timestamp: Date.now(),
      });
      throw error;
    }
  },
});

// Get last maintenance run info
export const getLastMaintenanceRun = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').take(1);
    if (users.length === 0) return null;

    const user = users[0];
    if (!user.stats?.streak) {
      // Return default values if no streak data exists
      return {
        lastRun: 0,
        status: 'pending' as const,
      };
    }

    return {
      lastRun: user.stats.streak.lastMaintenanceRun,
      status: user.stats.streak.maintenanceStatus,
    };
  },
});

// Safety check function
export const safetyCheck = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const lastRun = await ctx.runQuery(
      internal.streak.maintenance.getLastMaintenanceRun,
      {}
    );

    if (!lastRun) return; // No users to check

    // If last run was more than 24 hours ago or failed
    if (
      now - lastRun.lastRun > 24 * 60 * 60 * 1000 ||
      lastRun.status === 'failed'
    ) {
      // Trigger emergency streak maintenance
      await ctx.runAction(internal.streak.maintenance.maintainStreaks, {});
    }
  },
});
