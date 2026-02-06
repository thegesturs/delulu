import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
  automationCreateSchema,
  automationSchema,
  automationTriggerTypeSchema,
  automationUpdateSchema,
} from './schemas/automations';
import { getCurrentUser } from './users';
import { getCurrentTimestamp } from './utils';

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all automations for the current user
 */
export const getAutomations = query({
  args: {
    socialProviderId: v.optional(v.id('socialProviders')),
  },
  returns: v.array(automationSchema),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let automations;
    if (args.socialProviderId) {
      automations = await ctx.db
        .query('automations')
        .withIndex('by_social_provider_id', (q) =>
          q.eq('socialProviderId', args.socialProviderId!)
        )
        .collect();
    } else {
      automations = await ctx.db
        .query('automations')
        .withIndex('by_user_id', (q) => q.eq('userId', user._id))
        .collect();
    }

    // Sort by creation date (newest first)
    automations.sort((a, b) => b._creationTime - a._creationTime);

    return automations;
  },
});

/**
 * Get a single automation by ID
 */
export const getAutomation = query({
  args: { id: v.id('automations') },
  returns: v.union(automationSchema, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      return null;
    }

    return automation;
  },
});

/**
 * Get active automations for a social provider (used by Lambda processor)
 */
export const getActiveByProvider = query({
  args: {
    socialProviderId: v.id('socialProviders'),
    triggerType: automationTriggerTypeSchema,
  },
  returns: v.array(automationSchema),
  handler: async (ctx, args) => {
    const automations = await ctx.db
      .query('automations')
      .withIndex('by_social_provider_active', (q) =>
        q.eq('socialProviderId', args.socialProviderId).eq('isActive', true)
      )
      .collect();

    // Filter by trigger type
    return automations.filter((a) => a.triggerType === args.triggerType);
  },
});

/**
 * Get rate limit counts for an automation (used for rate limiting)
 */
export const getRateLimitCounts = query({
  args: { automationId: v.id('automations') },
  returns: v.object({
    hourCount: v.number(),
    dayCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get logs for this automation
    const logs = await ctx.db
      .query('automationLogs')
      .withIndex('by_automation_status', (q) =>
        q.eq('automationId', args.automationId).eq('status', 'DM_SENT')
      )
      .collect();

    const hourCount = logs.filter((l) => l.createdAt >= oneHourAgo).length;
    const dayCount = logs.filter((l) => l.createdAt >= oneDayAgo).length;

    return { hourCount, dayCount };
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new automation
 */
export const createAutomation = mutation({
  args: automationCreateSchema.fields,
  returns: v.id('automations'),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify user owns the social provider
    const socialProvider = await ctx.db.get(args.socialProviderId);
    if (!socialProvider || socialProvider.userId !== user._id) {
      throw new Error('Social provider not found or access denied');
    }

    // Only allow Instagram providers
    if (socialProvider.socialType !== 'INSTAGRAM') {
      throw new Error('Automations are only supported for Instagram accounts');
    }

    const now = getCurrentTimestamp();

    const automationId = await ctx.db.insert('automations', {
      userId: user._id,
      organizationId: args.organizationId,
      socialProviderId: args.socialProviderId,
      name: args.name,
      description: args.description,
      isActive: args.isActive ?? false,
      triggerType: args.triggerType,
      targetPostIds: args.targetPostIds,
      conditions: args.conditions,
      messageTemplate: args.messageTemplate,
      maxDMsPerHour: args.maxDMsPerHour ?? 20,
      maxDMsPerDay: args.maxDMsPerDay ?? 100,
      cooldownMinutes: args.cooldownMinutes,
      totalTriggered: 0,
      totalDMsSent: 0,
      totalFailed: 0,
      createdAt: now,
      updatedAt: now,
    });

    return automationId;
  },
});

/**
 * Update an existing automation
 */
export const updateAutomation = mutation({
  args: {
    id: v.id('automations'),
    ...automationUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      throw new Error('Automation not found or access denied');
    }

    const { id, ...updateData } = args;

    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

/**
 * Delete an automation
 */
export const deleteAutomation = mutation({
  args: { id: v.id('automations') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      throw new Error('Automation not found or access denied');
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

/**
 * Toggle automation active state
 */
export const toggleAutomation = mutation({
  args: { id: v.id('automations') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    const automation = await ctx.db.get(args.id);
    if (!automation || automation.userId !== user._id) {
      throw new Error('Automation not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isActive: !automation.isActive,
      updatedAt: getCurrentTimestamp(),
    });

    return !automation.isActive;
  },
});

/**
 * Increment automation stats (called by Lambda processor)
 */
export const incrementStats = mutation({
  args: {
    automationId: v.id('automations'),
    field: v.union(
      v.literal('totalTriggered'),
      v.literal('totalDMsSent'),
      v.literal('totalFailed')
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation) {
      return null;
    }

    const currentValue = automation[args.field] || 0;
    await ctx.db.patch(args.automationId, {
      [args.field]: currentValue + 1,
      updatedAt: getCurrentTimestamp(),
    });

    return null;
  },
});
