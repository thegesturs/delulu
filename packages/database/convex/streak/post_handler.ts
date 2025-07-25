import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

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
  current: 1, // Start with 1 since they just posted
  lastCountedDate: currentTime,
  longest: {
    count: 1,
    startDate: currentTime,
    endDate: currentTime,
  },
  lastCheckedDate: currentTime,
  publishedToday: true,
  lastMaintenanceRun: currentTime,
  maintenanceStatus: 'success',
});

export const handleSuccessfulPost = internalMutation({
  args: {
    userId: v.id('users'),
    publishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const today = new Date(args.publishedAt);
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // If user has no stats, initialize them
    if (!user.stats?.streak) {
      const stats = {
        streak: initializeStreak(todayTimestamp),
      };
      await ctx.db.patch(args.userId, { stats });
      return;
    }

    const lastCountedDate = new Date(user.stats.streak.lastCountedDate);
    lastCountedDate.setHours(0, 0, 0, 0);
    const lastCountedTimestamp = lastCountedDate.getTime();

    // If this is the first post of a new day
    if (todayTimestamp !== lastCountedTimestamp) {
      // Create a new stats object with the streak data
      const newStreak: StreakData = {
        ...user.stats.streak,
        current:
          todayTimestamp - lastCountedTimestamp <= 24 * 60 * 60 * 1000
            ? user.stats.streak.current + 1 // Continue streak
            : 1, // Start new streak
        lastCountedDate: todayTimestamp,
        publishedToday: true,
      };

      // Update longest streak if current is longer
      if (newStreak.current > newStreak.longest.count) {
        newStreak.longest = {
          count: newStreak.current,
          startDate:
            todayTimestamp - (newStreak.current - 1) * 24 * 60 * 60 * 1000,
          endDate: todayTimestamp,
        };
      }

      // Update user stats with new streak data
      await ctx.db.patch(args.userId, {
        stats: {
          ...user.stats,
          streak: newStreak,
        },
      });
    }
  },
});
