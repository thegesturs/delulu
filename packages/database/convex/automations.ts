import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import {
  DM_PLAN_LIMITS,
  automationConditionSchema,
  automationCreateSchema,
  automationSchema,
  automationUpdateSchema,
} from './schemas/automations';
import { getCurrentUser } from './users';
import { decryptData, getCurrentTimestamp } from './utils';

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
 * Get automations + access token + usage for webhook processing (called by CF Worker)
 * Single query: automations + token + plan limits + usage
 */
export const getForWebhook = query({
  args: {
    webhookSecret: v.string(),
    instagramAccountId: v.string(),
    mediaId: v.string(),
  },
  returns: v.union(
    v.object({
      automations: v.array(
        v.object({
          _id: v.id('automations'),
          conditions: v.array(automationConditionSchema),
          messageTemplate: v.string(),
        })
      ),
      accessToken: v.string(),
      profileId: v.string(),
      userId: v.id('users'),
      dmsSent: v.optional(v.number()),
      dmLimit: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Verify shared secret
    if (args.webhookSecret !== process.env.LAMBDA_SECRET_KEY) {
      return null;
    }

    // 1. Find social provider by profileId
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_profile_id', (q) =>
        q.eq('profileId', args.instagramAccountId)
      )
      .first();

    if (!provider || provider.socialType !== 'INSTAGRAM') {
      return null;
    }

    // 2. Get active automations, filter by mediaId
    const allAutomations = await ctx.db
      .query('automations')
      .withIndex('by_social_provider_active', (q) =>
        q.eq('socialProviderId', provider._id).eq('isActive', true)
      )
      .collect();

    // Filter to automations targeting this specific mediaId
    const matchingAutomations = allAutomations.filter((a) =>
      a.targetPostIds.includes(args.mediaId)
    );

    if (matchingAutomations.length === 0) {
      return null;
    }

    // 3. Get user + subscription for plan limits
    const user = await ctx.db.get(provider.userId!);
    if (!user) {
      return null;
    }

    let planType: 'FREE' | 'VIBE' | 'ECHO' = 'FREE';
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription && subscription.status === 'ACTIVE') {
        planType = subscription.planType as 'FREE' | 'VIBE' | 'ECHO';
      }
    }

    // 4. Decrypt access token
    const accessToken = await decryptData(provider.accessToken);

    return {
      automations: matchingAutomations.map((a) => ({
        _id: a._id,
        conditions: a.conditions,
        messageTemplate: a.messageTemplate,
      })),
      accessToken,
      profileId: provider.profileId,
      userId: user._id,
      dmsSent: user.usage.dmsSent ?? 0,
      dmLimit: DM_PLAN_LIMITS[planType],
    };
  },
});

/**
 * Record a DM sent (called by CF Worker)
 * Single mutation: increment usage + stats + minimal log
 */
export const recordDMSent = mutation({
  args: {
    webhookSecret: v.string(),
    userId: v.id('users'),
    automationId: v.id('automations'),
    instagramCommentId: v.string(),
    instagramUsername: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify shared secret
    if (args.webhookSecret !== process.env.LAMBDA_SECRET_KEY) {
      throw new Error('Unauthorized');
    }

    const now = getCurrentTimestamp();

    // 1. Increment user usage.dmsSent
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        usage: {
          ...user.usage,
          dmsSent: user.usage.dmsSent ? user.usage.dmsSent + 1 : 1,
        },
        updatedAt: now,
      });
    }

    // 2. Increment automation stats
    const automation = await ctx.db.get(args.automationId);
    if (automation) {
      await ctx.db.patch(args.automationId, {
        totalTriggered: automation.totalTriggered + 1,
        totalDMsSent: automation.totalDMsSent + 1,
        updatedAt: now,
      });
    }

    // 3. Insert minimal log
    await ctx.db.insert('automationLogs', {
      automationId: args.automationId,
      userId: args.userId,
      instagramCommentId: args.instagramCommentId,
      instagramUsername: args.instagramUsername,
      status: 'DM_SENT',
      createdAt: now,
    });

    return null;
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
