/**
 * Subscription Management Functions
 *
 * This file contains all subscription-related queries, mutations, and actions:
 * - Get current subscription
 * - Create/update subscriptions
 * - Handle checkout sessions
 * - Manage customer portal
 * - Check feature access and usage limits
 */

import { v } from 'convex/values';
import { action, internalMutation, query } from './_generated/server';
import { checkout, customerPortal } from './dodo';
import { planTypes, subscriptionSchema, subscriptionStatus } from './schemas';
import { getCurrentTimestamp } from './utils';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get current user's subscription
 */
export const getCurrentSubscription = query({
  args: {},
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
      .unique();

    if (!user || !user.subscriptionId) return null;

    const subscription = await ctx.db.get(user.subscriptionId);
    return subscription;
  },
});

/**
 * Get subscription by user ID
 */
export const getSubscriptionByUserId = query({
  args: { userId: v.id('users') },
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'ACTIVE'))
      .first();

    return subscription;
  },
});

/**
 * Get subscription by ID
 */
export const getSubscriptionById = query({
  args: { id: v.id('subscriptions') },
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============================================================================
// FEATURE ACCESS & LIMITS
// ============================================================================

/**
 * Check if user has access to a specific feature
 */
export const checkFeatureAccess = query({
  args: {
    feature: v.union(
      v.literal('aiContentGeneration'),
      v.literal('analytics'),
      v.literal('collaboration'),
      v.literal('whiteLabel'),
      v.literal('prioritySupport'),
      v.literal('customBranding'),
      v.literal('advancedScheduling'),
      v.literal('bulkUpload')
    ),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    planType: planTypes,
    needsUpgrade: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' = 'FREE';

    if (identity) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
        .unique();

      if (user?.subscriptionId) {
        const subscription = await ctx.db.get(user.subscriptionId);
        if (subscription) {
          planType = subscription.planType;
        }
      }
    }

    // Import plan features dynamically
    // Note: In production, you might want to define this mapping in the schema
    const planFeatures: Record<string, Record<string, boolean>> = {
      FREE: {
        aiContentGeneration: false,
        analytics: false,
        collaboration: false,
        whiteLabel: false,
        prioritySupport: false,
        customBranding: false,
        advancedScheduling: false,
        bulkUpload: false,
      },
      STARTER: {
        aiContentGeneration: false,
        analytics: true,
        collaboration: false,
        whiteLabel: false,
        prioritySupport: false,
        customBranding: false,
        advancedScheduling: true,
        bulkUpload: false,
      },
      PRO: {
        aiContentGeneration: true,
        analytics: true,
        collaboration: true,
        whiteLabel: false,
        prioritySupport: true,
        customBranding: false,
        advancedScheduling: true,
        bulkUpload: true,
      },
      ENTERPRISE: {
        aiContentGeneration: true,
        analytics: true,
        collaboration: true,
        whiteLabel: true,
        prioritySupport: true,
        customBranding: true,
        advancedScheduling: true,
        bulkUpload: true,
      },
    };

    const hasAccess = planFeatures[planType][args.feature] || false;

    return {
      hasAccess,
      planType,
      needsUpgrade: !hasAccess,
    };
  },
});

/**
 * Check if user can perform an action based on usage limits
 */
export const checkUsageLimit = query({
  args: {
    limitType: v.union(
      v.literal('socialAccounts'),
      v.literal('monthlyPosts'),
      v.literal('mediaStorage'),
      v.literal('teamMembers')
    ),
    currentValue: v.number(),
  },
  returns: v.object({
    allowed: v.boolean(),
    limit: v.number(), // -1 for unlimited
    remaining: v.number(), // -1 for unlimited
    planType: planTypes,
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' = 'FREE';

    if (identity) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
        .unique();

      if (user?.subscriptionId) {
        const subscription = await ctx.db.get(user.subscriptionId);
        if (subscription) {
          planType = subscription.planType;
        }
      }
    }

    // Plan limits
    const planLimits: Record<string, Record<string, number>> = {
      FREE: {
        socialAccounts: 1,
        monthlyPosts: 10,
        mediaStorage: 100,
        teamMembers: 1,
      },
      STARTER: {
        socialAccounts: 3,
        monthlyPosts: 50,
        mediaStorage: 1000,
        teamMembers: 1,
      },
      PRO: {
        socialAccounts: 10,
        monthlyPosts: 200,
        mediaStorage: 5000,
        teamMembers: 5,
      },
      ENTERPRISE: {
        socialAccounts: -1, // Unlimited
        monthlyPosts: -1,
        mediaStorage: -1,
        teamMembers: -1,
      },
    };

    const limit = planLimits[planType][args.limitType];
    const allowed = limit === -1 || args.currentValue < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - args.currentValue);

    return {
      allowed,
      limit,
      remaining,
      planType,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new subscription (internal)
 */
export const createSubscription = internalMutation({
  args: {
    userId: v.id('users'),
    dodoCustomerId: v.string(),
    dodoSubscriptionId: v.optional(v.string()),
    planType: planTypes,
    status: subscriptionStatus,
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        productId: v.optional(v.string()),
        priceId: v.optional(v.string()),
      })
    ),
  },
  returns: v.id('subscriptions'),
  handler: async (ctx, args) => {
    const subscriptionId = await ctx.db.insert('subscriptions', {
      ...args,
      updatedAt: getCurrentTimestamp(),
    });

    // Update user with subscription reference
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        subscriptionId,
        dodoCustomerId: args.dodoCustomerId,
        updatedAt: getCurrentTimestamp(),
      });
    }

    return subscriptionId;
  },
});

/**
 * Update an existing subscription (internal)
 */
export const updateSubscription = internalMutation({
  args: {
    id: v.id('subscriptions'),
    planType: v.optional(planTypes),
    status: v.optional(subscriptionStatus),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    metadata: v.optional(
      v.object({
        productId: v.optional(v.string()),
        priceId: v.optional(v.string()),
        cancelReason: v.optional(v.string()),
      })
    ),
  },
  returns: v.id('subscriptions'),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: getCurrentTimestamp(),
    });

    return id;
  },
});

// ============================================================================
// ACTIONS (Dodo Payments API calls)
// ============================================================================

/**
 * Create a checkout session for a product
 */
export const createCheckoutSession = action({
  args: {
    productId: v.string(),
    quantity: v.optional(v.number()),
    returnUrl: v.optional(v.string()),
  },
  returns: v.object({
    checkout_url: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const session = await checkout(ctx, {
        payload: {
          product_cart: [
            {
              product_id: args.productId,
              quantity: args.quantity || 1,
            },
          ],
          return_url: args.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
          billing_currency: 'USD',
          feature_flags: {
            allow_discount_code: true,
          },
        },
      });

      if (!session?.checkout_url) {
        throw new Error('Checkout session did not return a checkout_url');
      }

      return { checkout_url: session.checkout_url };
    } catch (error) {
      console.error('[Dodo] Failed to create checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  },
});

/**
 * Get customer portal URL
 */
export const getCustomerPortal = action({
  args: {
    sendEmail: v.optional(v.boolean()),
  },
  returns: v.object({
    portal_url: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const portal = await customerPortal(ctx, {
        send_email: args.sendEmail || false,
      });

      if (!portal?.portal_url) {
        throw new Error('Customer portal did not return a portal_url');
      }

      return { portal_url: portal.portal_url };
    } catch (error) {
      console.error('[Dodo] Failed to get customer portal:', error);
      throw new Error('Failed to get customer portal');
    }
  },
});
