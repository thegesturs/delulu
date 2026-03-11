/**
 * Webhook Event Handlers
 *
 * This file contains mutation handlers for Dodo Payments webhook events
 */

import { getPlanFromProductId } from "@delulu/payments/product-ids";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { getCurrentTimestamp } from "./utils";

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
    console.log("[Webhook] Payment succeeded:", args.paymentId);

    // Find user by email using index
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();

    if (!user) {
      console.error("[Webhook] User not found for email:", args.customerEmail);
      throw new Error(
        `User not found for email ${args.customerEmail}. Webhook will be retried by Dodo.`
      );
    }

    // Update user with Dodo customer ID if not already set
    if (!user.dodoCustomerId) {
      await ctx.db.patch(user._id, {
        dodoCustomerId: args.customerId,
      });
      console.log("[Webhook] Updated user with Dodo customer ID:", user._id);
    }

    // Create transaction record
    await ctx.db.insert("transactions", {
      userId: user._id,
      subscriptionId: user.subscriptionId,
      dodoPaymentId: args.paymentId,
      dodoCustomerId: args.customerId,
      amount: args.amount,
      currency: args.currency,
      status: "SUCCEEDED",
      paidAt: getCurrentTimestamp(),
      metadata: {
        productId: args.productId,
        webhookPayload: args.webhookPayload,
      },
      updatedAt: getCurrentTimestamp(),
    });

    console.log("[Webhook] Transaction recorded for user:", user._id);
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
    console.log("[Webhook] Subscription activated:", args.subscriptionId);

    // Find user by email using index
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();

    if (!user) {
      console.error("[Webhook] User not found for email:", args.customerEmail);
      throw new Error(
        `User not found for email ${args.customerEmail}. Webhook will be retried by Dodo.`
      );
    }

    // Update user with Dodo customer ID if not already set
    if (!user.dodoCustomerId) {
      await ctx.db.patch(user._id, {
        dodoCustomerId: args.customerId,
      });
      console.log("[Webhook] Updated user with Dodo customer ID:", user._id);
    }

    // Determine plan type and billing period based on product ID
    // Supports both test and production product IDs
    const planInfo = getPlanFromProductId(args.productId);

    if (!planInfo) {
      console.error("[Webhook] Unknown product ID:", args.productId);
      throw new Error(
        `Unknown product ID: ${args.productId}. Please add this product ID to the product-ids.ts configuration.`
      );
    }

    const { planType, billingPeriod } = planInfo;

    // Check if subscription already exists
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_dodo_subscription_id", (q) =>
        q.eq("dodoSubscriptionId", args.subscriptionId)
      )
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.runMutation(internal.subscriptions.updateSubscription, {
        id: existingSubscription._id,
        status: "ACTIVE",
        planType,
        billingPeriod,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        metadata: {
          productId: args.productId,
          priceId: args.priceId,
        },
      });
      console.log("[Webhook] Subscription updated:", existingSubscription._id);
    } else {
      // Create new subscription
      const newSubscriptionId = await ctx.runMutation(
        internal.subscriptions.createSubscription,
        {
          userId: user._id,
          dodoCustomerId: args.customerId,
          dodoSubscriptionId: args.subscriptionId,
          planType,
          billingPeriod,
          status: "ACTIVE",
          currentPeriodStart: args.currentPeriodStart,
          currentPeriodEnd: args.currentPeriodEnd,
          metadata: {
            productId: args.productId,
            priceId: args.priceId,
          },
        }
      );
      console.log("[Webhook] Subscription created:", newSubscriptionId);
    }
  },
});

/**
 * Handle Sorted extension subscription activation
 * Creates a real addon subscription record so status can be tracked properly
 */
export const handleSortedSubscription = internalMutation({
  args: {
    customerEmail: v.string(),
    customerId: v.string(),
    subscriptionId: v.string(),
    productId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    console.log("[Webhook] Sorted subscription for:", args.customerEmail);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();

    if (!user) {
      console.error("[Webhook] User not found for email:", args.customerEmail);
      throw new Error(
        `User not found for email ${args.customerEmail}. Webhook will be retried by Dodo.`
      );
    }

    // Set dodoCustomerId if not already set
    if (!user.dodoCustomerId) {
      await ctx.db.patch(user._id, {
        dodoCustomerId: args.customerId,
      });
    }

    // Check if subscription already exists (handles renewals)
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_dodo_subscription_id", (q) =>
        q.eq("dodoSubscriptionId", args.subscriptionId)
      )
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        status: "ACTIVE",
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        metadata: { productId: args.productId },
        updatedAt: getCurrentTimestamp(),
      });
      console.log(
        "[Webhook] Sorted subscription updated:",
        existingSubscription._id
      );
    } else {
      // Create new addon subscription record
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: user._id,
        dodoCustomerId: args.customerId,
        dodoSubscriptionId: args.subscriptionId,
        planType: "FREE", // addon doesn't map to a plan
        status: "ACTIVE",
        type: "addon",
        addonType: "sorted",
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        metadata: { productId: args.productId },
        updatedAt: getCurrentTimestamp(),
      });

      // Append to user's addonSubscriptionIds
      const existingAddonIds = user.addonSubscriptionIds ?? [];
      await ctx.db.patch(user._id, {
        addonSubscriptionIds: [...existingAddonIds, subscriptionId],
        updatedAt: getCurrentTimestamp(),
      });

      console.log("[Webhook] Sorted subscription created:", subscriptionId);
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
    console.log("[Webhook] Subscription cancelled:", args.subscriptionId);

    // Find subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_dodo_subscription_id", (q) =>
        q.eq("dodoSubscriptionId", args.subscriptionId)
      )
      .first();

    if (!subscription) {
      console.error("[Webhook] Subscription not found:", args.subscriptionId);
      throw new Error(
        `Subscription not found: ${args.subscriptionId}. Webhook will be retried by Dodo.`
      );
    }

    // Update subscription status
    await ctx.runMutation(internal.subscriptions.updateSubscription, {
      id: subscription._id,
      status: "CANCELLED",
      metadata: {
        cancelReason: args.cancellationReason,
      },
    });

    console.log("[Webhook] Subscription status updated to CANCELLED");
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
    customerEmail: v.string(),
    failureReason: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(
      "[Webhook] Payment failed:",
      args.paymentId,
      args.failureReason
    );

    // Find user by email using index
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();

    if (!user) {
      console.error("[Webhook] User not found for email:", args.customerEmail);
      throw new Error(
        `User not found for email ${args.customerEmail}. Webhook will be retried by Dodo.`
      );
    }

    // Update user with Dodo customer ID if not already set
    if (!user.dodoCustomerId) {
      await ctx.db.patch(user._id, {
        dodoCustomerId: args.customerId,
      });
      console.log("[Webhook] Updated user with Dodo customer ID:", user._id);
    }

    // Create failed transaction record
    await ctx.db.insert("transactions", {
      userId: user._id,
      subscriptionId: user.subscriptionId,
      dodoPaymentId: args.paymentId,
      dodoCustomerId: args.customerId,
      amount: args.amount,
      currency: args.currency,
      status: "FAILED",
      failureReason: args.failureReason,
      updatedAt: getCurrentTimestamp(),
    });

    // If user has an active subscription, mark it as past due
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription && subscription.status === "ACTIVE") {
        await ctx.runMutation(internal.subscriptions.updateSubscription, {
          id: subscription._id,
          status: "PAST_DUE",
        });
      }
    }

    console.log("[Webhook] Failed payment recorded for user:", user._id);
  },
});
