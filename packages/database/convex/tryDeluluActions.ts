"use node";

import {
  PROD_PRODUCT_IDS_INR,
  TEST_PRODUCT_IDS_INR,
} from "@delulu/payments/product-ids";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const CALLMELATER_API_URL = "https://api.callmelater.xyz";

/**
 * Get the target ECHO monthly product ID for INR (Try Delulu is INR-only)
 */
function getTargetEchoProductId(): string {
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT;
  return env === "live_mode"
    ? PROD_PRODUCT_IDS_INR.ECHO.monthly
    : TEST_PRODUCT_IDS_INR.ECHO.monthly;
}

/**
 * Handle Try Delulu subscription activation
 * 1. Create subscription via existing handler
 * 2. Mark as Try Delulu
 * 3. Schedule CallMeLater to switch to regular ECHO
 */
export const handleTryDeluluActivated = internalAction({
  args: {
    subscriptionId: v.string(),
    businessId: v.string(),
    customerId: v.string(),
    customerEmail: v.string(),
    productId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    webhookPayload: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("[TryDelulu] Handling activation for:", args.subscriptionId);

    // 1. Create subscription via existing handler (planType will be ECHO from getPlanFromProductId)
    await ctx.runMutation(internal.webhooks.handleSubscriptionActivated, {
      subscriptionId: args.subscriptionId,
      businessId: args.businessId,
      customerId: args.customerId,
      customerEmail: args.customerEmail,
      status: "ACTIVE",
      productId: args.productId,
      priceId: "",
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      webhookPayload: args.webhookPayload,
    });

    // 2. Mark as Try Delulu
    await ctx.runMutation(internal.tryDelulu.markAsTryDelulu, {
      dodoSubscriptionId: args.subscriptionId,
    });

    // 3. Determine target product ID and schedule switch
    const targetProductId = getTargetEchoProductId();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const apiKey = process.env.CALLMELATER_API_KEY;

    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
    }
    if (!apiKey) {
      throw new Error("CALLMELATER_API_KEY environment variable is not set");
    }

    // Schedule 1 day before period end
    const switchAt = new Date(
      args.currentPeriodEnd - 24 * 60 * 60 * 1000
    ).toISOString();

    console.log("[TryDelulu] Scheduling plan switch for:", switchAt);

    const response = await fetch(`${CALLMELATER_API_URL}/schedule`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUrl: `${appUrl}/api/switch-try-delulu`,
        targetMethod: "POST",
        targetHeaders: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        targetBody: {
          dodoSubscriptionId: args.subscriptionId,
          targetProductId,
        },
        triggerAt: switchAt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to schedule Try Delulu switch with CallMeLater: ${response.status} ${errorText}`
      );
    }

    const result = (await response.json()) as { scheduleId: string };

    // 4. Save schedule ID
    await ctx.runMutation(internal.tryDelulu.saveScheduleId, {
      dodoSubscriptionId: args.subscriptionId,
      scheduleId: result.scheduleId,
    });

    console.log(
      "[TryDelulu] Activation complete. Schedule ID:",
      result.scheduleId
    );
  },
});
