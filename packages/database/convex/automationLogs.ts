import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  automationLogCreateSchema,
  automationLogSchema,
  automationLogStatusSchema,
} from './schemas/automations';
import { getCurrentUser } from './users';
import { getCurrentTimestamp } from './utils';

// ============================================================================
// Queries
// ============================================================================

/**
 * Get logs for an automation
 */
export const getLogsByAutomation = query({
  args: {
    automationId: v.id('automations'),
    limit: v.optional(v.number()),
    status: v.optional(automationLogStatusSchema),
  },
  returns: v.array(automationLogSchema),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Verify user owns the automation
    const automation = await ctx.db.get(args.automationId);
    if (!automation || automation.userId !== user._id) {
      return [];
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let logsQuery;
    if (args.status) {
      logsQuery = ctx.db
        .query('automationLogs')
        .withIndex('by_automation_status', (q) =>
          q.eq('automationId', args.automationId).eq('status', args.status!)
        );
    } else {
      logsQuery = ctx.db
        .query('automationLogs')
        .withIndex('by_automation_id', (q) =>
          q.eq('automationId', args.automationId)
        );
    }

    const logs = await logsQuery.order('desc').take(args.limit ?? 100);
    return logs;
  },
});

/**
 * Get log by Instagram comment ID (for duplicate detection)
 */
export const getByCommentId = query({
  args: { instagramCommentId: v.string() },
  returns: v.union(automationLogSchema, v.null()),
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query('automationLogs')
      .withIndex('by_instagram_comment_id', (q) =>
        q.eq('instagramCommentId', args.instagramCommentId)
      )
      .first();

    return log;
  },
});

/**
 * Get automation analytics
 */
export const getAnalytics = query({
  args: {
    automationId: v.id('automations'),
    daysBack: v.optional(v.number()),
  },
  returns: v.object({
    totalLogs: v.number(),
    dmsSent: v.number(),
    dmsFailed: v.number(),
    rateLimited: v.number(),
    conditionNotMet: v.number(),
    duplicates: v.number(),
    successRate: v.number(),
    dailyCounts: v.array(
      v.object({
        date: v.string(),
        sent: v.number(),
        failed: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        totalLogs: 0,
        dmsSent: 0,
        dmsFailed: 0,
        rateLimited: 0,
        conditionNotMet: 0,
        duplicates: 0,
        successRate: 0,
        dailyCounts: [],
      };
    }

    // Verify user owns the automation
    const automation = await ctx.db.get(args.automationId);
    if (!automation || automation.userId !== user._id) {
      return {
        totalLogs: 0,
        dmsSent: 0,
        dmsFailed: 0,
        rateLimited: 0,
        conditionNotMet: 0,
        duplicates: 0,
        successRate: 0,
        dailyCounts: [],
      };
    }

    const daysBack = args.daysBack ?? 30;
    const startDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query('automationLogs')
      .withIndex('by_automation_id', (q) =>
        q.eq('automationId', args.automationId)
      )
      .collect();

    // Filter by date
    const recentLogs = logs.filter((l) => l.createdAt >= startDate);

    // Calculate stats
    const dmsSent = recentLogs.filter((l) => l.status === 'DM_SENT').length;
    const dmsFailed = recentLogs.filter((l) => l.status === 'DM_FAILED').length;
    const rateLimited = recentLogs.filter(
      (l) => l.status === 'RATE_LIMITED'
    ).length;
    const conditionNotMet = recentLogs.filter(
      (l) => l.status === 'CONDITION_NOT_MET'
    ).length;
    const duplicates = recentLogs.filter(
      (l) => l.status === 'DUPLICATE'
    ).length;

    const totalAttempted = dmsSent + dmsFailed;
    const successRate =
      totalAttempted > 0 ? (dmsSent / totalAttempted) * 100 : 0;

    // Calculate daily counts
    const dailyMap = new Map<string, { sent: number; failed: number }>();
    for (const log of recentLogs) {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { sent: 0, failed: 0 };
      if (log.status === 'DM_SENT') {
        existing.sent++;
      } else if (log.status === 'DM_FAILED') {
        existing.failed++;
      }
      dailyMap.set(date, existing);
    }

    const dailyCounts = Array.from(dailyMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs: recentLogs.length,
      dmsSent,
      dmsFailed,
      rateLimited,
      conditionNotMet,
      duplicates,
      successRate: Math.round(successRate * 100) / 100,
      dailyCounts,
    };
  },
});

// ============================================================================
// Mutations (called by Lambda processor)
// ============================================================================

/**
 * Create an automation log entry
 */
export const create = mutation({
  args: automationLogCreateSchema.fields,
  returns: v.id('automationLogs'),
  handler: async (ctx, args) => {
    // Get the automation to find the user
    const automation = await ctx.db.get(args.automationId);
    if (!automation) {
      throw new Error('Automation not found');
    }

    const logId = await ctx.db.insert('automationLogs', {
      ...args,
      userId: automation.userId,
      createdAt: getCurrentTimestamp(),
    });

    return logId;
  },
});
