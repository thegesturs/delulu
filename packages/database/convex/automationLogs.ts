import { v } from 'convex/values';
import { query } from './_generated/server';
import { automationLogSchema } from './schemas/automations';
import { getCurrentUser } from './users';

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

    const logs = await ctx.db
      .query('automationLogs')
      .withIndex('by_automation_id', (q) =>
        q.eq('automationId', args.automationId)
      )
      .order('desc')
      .take(args.limit ?? 100);

    return logs;
  },
});
