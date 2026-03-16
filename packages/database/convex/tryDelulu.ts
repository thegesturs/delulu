import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Mark a subscription as Try Delulu
 */
export const markAsTryDelulu = internalMutation({
  args: {
    dodoSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_dodo_subscription_id", (q) =>
        q.eq("dodoSubscriptionId", args.dodoSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found: ${args.dodoSubscriptionId}`);
    }

    await ctx.db.patch(subscription._id, {
      metadata: {
        ...subscription.metadata,
        isTryDelulu: true,
      },
    });
  },
});

/**
 * Save CallMeLater schedule ID for Try Delulu auto-switch
 */
export const saveScheduleId = internalMutation({
  args: {
    dodoSubscriptionId: v.string(),
    scheduleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_dodo_subscription_id", (q) =>
        q.eq("dodoSubscriptionId", args.dodoSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found: ${args.dodoSubscriptionId}`);
    }

    await ctx.db.patch(subscription._id, {
      metadata: {
        ...subscription.metadata,
        tryDeluluScheduleId: args.scheduleId,
      },
    });
  },
});

/**
 * Clear Try Delulu metadata after successful plan switch
 */
export const clearTryDeluluMetadata = internalMutation({
  args: {
    dodoSubscriptionId: v.string(),
    targetProductId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_dodo_subscription_id", (q) =>
        q.eq("dodoSubscriptionId", args.dodoSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.error(
        "[TryDelulu] Subscription not found for cleanup:",
        args.dodoSubscriptionId
      );
      return;
    }

    await ctx.db.patch(subscription._id, {
      metadata: {
        ...subscription.metadata,
        productId: args.targetProductId,
        isTryDelulu: undefined,
        tryDeluluScheduleId: undefined,
      },
    });

    console.log(
      "[TryDelulu] Metadata cleared for subscription:",
      subscription._id
    );
  },
});
