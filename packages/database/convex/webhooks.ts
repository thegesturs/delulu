/**
 * Webhook Event Handlers
 *
 * This file contains mutation handlers for Dodo Payments webhook events
 */

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';
import { getCurrentTimestamp } from './utils';

/**
 * Handle payment succeeded event
 * Called when a payment is successfully processed
 */
export const handlePaymentSucceeded = internalMutation({
  args: {
    paymentId: v.string(),
    businessId: v.string(),
    customerEmail: v.string(),
    customerId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    subscriptionId: v.optional(v.string()),
    productId: v.optional(v.string()),
    webhookPayload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[Webhook] Payment succeeded:', args.paymentId);

    // Find user by Dodo customer ID
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('dodoCustomerId'), args.customerId))
      .first();

    if (!user) {
      console.error('[Webhook] User not found for customer:', args.customerId);
      return;
    }

    // Create transaction record
    await ctx.db.insert('transactions', {
      userId: user._id,
      subscriptionId: user.subscriptionId,
      dodoPaymentId: args.paymentId,
      dodoCustomerId: args.customerId,
      amount: args.amount,
      currency: args.currency,
      status: 'SUCCEEDED',
      paidAt: getCurrentTimestamp(),
      metadata: {
        productId: args.productId,
        webhookPayload: args.webhookPayload,
      },
      updatedAt: getCurrentTimestamp(),
    });

    console.log('[Webhook] Transaction recorded for user:', user._id);
  },
});

/**
 * Handle subscription activated event
 * Called when a subscription becomes active
 */
export const handleSubscriptionActivated = internalMutation({
  args: {
    subscriptionId: v.string(),
    businessId: v.string(),
    customerId: v.string(),
    customerEmail: v.string(),
    status: v.string(),
    productId: v.string(),
    priceId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    webhookPayload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[Webhook] Subscription activated:', args.subscriptionId);

    // Find user by Dodo customer ID
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('dodoCustomerId'), args.customerId))
      .first();

    if (!user) {
      console.error('[Webhook] User not found for customer:', args.customerId);
      return;
    }

    // Determine plan type based on product ID
    // You should map your Dodo product IDs to plan types here
    let planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' = 'STARTER';

    // Example mapping (update with your actual product IDs)
    // if (args.productId === 'prod_starter_monthly') planType = 'STARTER';
    // if (args.productId === 'prod_pro_monthly') planType = 'PRO';
    // if (args.productId === 'prod_enterprise_monthly') planType = 'ENTERPRISE';

    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_dodo_subscription_id', (q) => q.eq('dodoSubscriptionId', args.subscriptionId))
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.runMutation(internal.subscriptions.updateSubscription, {
        id: existingSubscription._id,
        status: 'ACTIVE',
        planType,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        metadata: {
          productId: args.productId,
          priceId: args.priceId,
        },
      });
      console.log('[Webhook] Subscription updated:', existingSubscription._id);
    } else {
      // Create new subscription
      const newSubscriptionId = await ctx.runMutation(internal.subscriptions.createSubscription, {
        userId: user._id,
        dodoCustomerId: args.customerId,
        dodoSubscriptionId: args.subscriptionId,
        planType,
        status: 'ACTIVE',
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        metadata: {
          productId: args.productId,
          priceId: args.priceId,
        },
      });
      console.log('[Webhook] Subscription created:', newSubscriptionId);
    }
  },
});

/**
 * Handle subscription cancelled event
 * Called when a subscription is cancelled
 */
export const handleSubscriptionCancelled = internalMutation({
  args: {
    subscriptionId: v.string(),
    customerId: v.string(),
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log('[Webhook] Subscription cancelled:', args.subscriptionId);

    // Find subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_dodo_subscription_id', (q) => q.eq('dodoSubscriptionId', args.subscriptionId))
      .first();

    if (!subscription) {
      console.error('[Webhook] Subscription not found:', args.subscriptionId);
      return;
    }

    // Update subscription status
    await ctx.runMutation(internal.subscriptions.updateSubscription, {
      id: subscription._id,
      status: 'CANCELLED',
      metadata: {
        cancelReason: args.cancellationReason,
      },
    });

    console.log('[Webhook] Subscription status updated to CANCELLED');
  },
});

/**
 * Handle payment failed event
 * Called when a payment fails
 */
export const handlePaymentFailed = internalMutation({
  args: {
    paymentId: v.string(),
    customerId: v.string(),
    failureReason: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('[Webhook] Payment failed:', args.paymentId, args.failureReason);

    // Find user by Dodo customer ID
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('dodoCustomerId'), args.customerId))
      .first();

    if (!user) {
      console.error('[Webhook] User not found for customer:', args.customerId);
      return;
    }

    // Create failed transaction record
    await ctx.db.insert('transactions', {
      userId: user._id,
      subscriptionId: user.subscriptionId,
      dodoPaymentId: args.paymentId,
      dodoCustomerId: args.customerId,
      amount: args.amount,
      currency: args.currency,
      status: 'FAILED',
      failureReason: args.failureReason,
      updatedAt: getCurrentTimestamp(),
    });

    // If user has an active subscription, mark it as past due
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription && subscription.status === 'ACTIVE') {
        await ctx.runMutation(internal.subscriptions.updateSubscription, {
          id: subscription._id,
          status: 'PAST_DUE',
        });
      }
    }

    console.log('[Webhook] Failed payment recorded for user:', user._id);
  },
});
