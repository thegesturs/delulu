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

import { PLANS } from "@delulu/payments/plans";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  type QueryCtx,
  query,
} from "./_generated/server";
import { checkout, customerPortal } from "./dodo";
import {
  addonType as addonTypeValidator,
  billingPeriod,
  planTypes,
  subscriptionSchema,
  subscriptionStatus,
  subscriptionType,
} from "./schemas";
import { postsByUserStatus } from "./stats";
import { getCurrentTimestamp } from "./utils";

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
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user?.subscriptionId) {
      return null;
    }

    const subscription = await ctx.db.get(user.subscriptionId);
    return subscription;
  },
});

/**
 * Get subscription by user ID
 */
export const getSubscriptionByUserId = query({
  args: { userId: v.id("users") },
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .first();

    return subscription;
  },
});

/**
 * Get subscription by ID
 */
export const getSubscriptionById = query({
  args: { id: v.id("subscriptions") },
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get current user's addon subscription by addon type
 */
export const getAddonSubscription = query({
  args: { addonType: v.string() },
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user?.addonSubscriptionIds?.length) {
      return null;
    }

    for (const subId of user.addonSubscriptionIds) {
      const sub = await ctx.db.get(subId);
      if (sub?.type === "addon" && sub.addonType === args.addonType) {
        return sub;
      }
    }

    return null;
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
    feature: v.union(v.literal("postScheduling"), v.literal("prioritySupport")),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    planType: planTypes,
    needsUpgrade: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let planType: "FREE" | "ECHO" | "VIBE" = "FREE";

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", identity.subject)
        )
        .unique();

      if (user?.subscriptionId) {
        const subscription = await ctx.db.get(user.subscriptionId);
        if (subscription) {
          planType = subscription.planType;
        }
      }
    }

    // Get plan features from single source of truth
    const plan = PLANS[planType];
    const hasAccess = plan.features[args.feature];

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
      v.literal("socialAccounts"),
      v.literal("monthlyPosts"),
      v.literal("mediaStorage"),
      v.literal("teamMembers")
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
    let planType: "FREE" | "ECHO" | "VIBE" = "FREE";

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", identity.subject)
        )
        .unique();

      if (user?.subscriptionId) {
        const subscription = await ctx.db.get(user.subscriptionId);
        if (subscription) {
          planType = subscription.planType;
        }
      }
    }

    // Get plan limits from single source of truth
    const plan = PLANS[planType];
    const limit = plan.limits[args.limitType];
    const allowed = limit === -1 || args.currentValue < limit;
    const remaining =
      limit === -1 ? -1 : Math.max(0, limit - args.currentValue);

    return {
      allowed,
      limit,
      remaining,
      planType,
    };
  },
});

/**
 * Check social account limit with current count in one query
 * Replaces the pattern of calling getConnectedAccounts + checkUsageLimit separately
 */
export const checkSocialAccountLimit = query({
  args: {},
  returns: v.object({
    currentCount: v.number(),
    limit: v.number(),
    allowed: v.boolean(),
    planType: planTypes,
    remaining: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        currentCount: 0,
        limit: 1, // FREE plan default
        allowed: true,
        planType: "FREE" as const,
        remaining: 1,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      return {
        currentCount: 0,
        limit: 1,
        allowed: true,
        planType: "FREE" as const,
        remaining: 1,
      };
    }

    // Get plan type
    let planType: "FREE" | "ECHO" | "VIBE" = "FREE";
    if (user.subscriptionId) {
      const subscription = await ctx.db.get(user.subscriptionId);
      if (subscription) {
        planType = subscription.planType;
      }
    }

    // Count current social accounts in ONE query
    const currentAccounts = await ctx.db
      .query("socialProviders")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const currentCount = currentAccounts.length;
    const plan = PLANS[planType];
    const limit = plan.limits.socialAccounts;
    const allowed = limit === -1 || currentCount < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - currentCount);

    return {
      currentCount,
      limit,
      allowed,
      planType,
      remaining,
    };
  },
});

/**
 * Get current user's actual usage
 * Counts social accounts, monthly posts, and media storage
 */
export const getUserUsage = query({
  args: {},
  returns: v.object({
    socialAccounts: v.number(),
    monthlyPosts: v.number(),
    mediaStorage: v.number(),
    teamMembers: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        socialAccounts: 0,
        monthlyPosts: 0,
        mediaStorage: 0,
        teamMembers: 1,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      return {
        socialAccounts: 0,
        monthlyPosts: 0,
        mediaStorage: 0,
        teamMembers: 1,
      };
    }

    // Count social accounts
    const socialAccounts = await ctx.db
      .query("socialProviders")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Count posts created this month
    const now = Date.now();
    const monthStart = new Date(
      new Date(now).getFullYear(),
      new Date(now).getMonth(),
      1
    ).getTime();

    const postsThisMonth = await ctx.db
      .query("posts")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), monthStart),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .collect();

    // Calculate media storage (sum of all media file sizes in MB)
    const mediaFiles = await ctx.db
      .query("media")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    const totalStorageMB =
      mediaFiles.reduce((sum, media) => sum + (media.size ?? 0), 0) /
      (1024 * 1024); // Convert bytes to MB

    return {
      socialAccounts: socialAccounts.length,
      monthlyPosts: postsThisMonth.length,
      mediaStorage: Math.round(totalStorageMB),
      teamMembers: 1, // TODO: Implement team member counting when org feature is added
    };
  },
});

// ============================================================================
// CORE HELPERS (shared by public queries and internal API variants)
// ============================================================================

async function getPlanTypeForUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<"FREE" | "ECHO" | "VIBE"> {
  const user = await ctx.db.get(userId);
  if (!user?.subscriptionId) {
    return "FREE";
  }

  const subscription = await ctx.db.get(user.subscriptionId);
  if (subscription && subscription.status === "ACTIVE") {
    return subscription.planType;
  }
  return "FREE";
}

export async function getSubscriptionByUserIdCore(
  ctx: QueryCtx,
  userId: Id<"users">
) {
  const user = await ctx.db.get(userId);
  if (!user?.subscriptionId) {
    return null;
  }
  return ctx.db.get(user.subscriptionId);
}

export async function getUserUsageCore(ctx: QueryCtx, userId: Id<"users">) {
  const socialAccounts = await ctx.db
    .query("socialProviders")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("isActive"), true))
    .collect();

  // Use aggregator for efficient post counting instead of fetching all posts
  const totalPosts = await postsByUserStatus.count(ctx, {
    bounds: { prefix: [userId] },
  });
  const deletedPosts = await postsByUserStatus.count(ctx, {
    bounds: { prefix: [userId, "DELETED"] },
  });
  const monthlyPosts = totalPosts - deletedPosts;

  const mediaFiles = await ctx.db
    .query("media")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();

  const totalStorageMB =
    mediaFiles.reduce((sum, media) => sum + (media.size ?? 0), 0) /
    (1024 * 1024);

  return {
    socialAccounts: socialAccounts.length,
    monthlyPosts,
    mediaStorage: Math.round(totalStorageMB),
    teamMembers: 1,
  };
}

// ============================================================================
// PUBLIC API VARIANTS (for REST API / MCP server)
// ============================================================================

export const apiGetSubscription = query({
  args: { userId: v.id("users") },
  returns: v.union(subscriptionSchema, v.null()),
  handler: async (ctx, args) => {
    return getSubscriptionByUserIdCore(ctx, args.userId);
  },
});

export const apiGetUsage = query({
  args: { userId: v.id("users") },
  returns: v.object({
    socialAccounts: v.number(),
    monthlyPosts: v.number(),
    mediaStorage: v.number(),
    teamMembers: v.number(),
    planType: planTypes,
    limits: v.object({
      socialAccounts: v.number(),
      monthlyPosts: v.number(),
      mediaStorage: v.number(),
      teamMembers: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const usage = await getUserUsageCore(ctx, args.userId);
    const planType = await getPlanTypeForUser(ctx, args.userId);
    const plan = PLANS[planType];

    return {
      ...usage,
      planType,
      limits: plan.limits,
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
    userId: v.id("users"),
    dodoCustomerId: v.string(),
    dodoSubscriptionId: v.optional(v.string()),
    planType: planTypes,
    status: subscriptionStatus,
    type: v.optional(subscriptionType),
    addonType: v.optional(addonTypeValidator),
    billingPeriod: v.optional(billingPeriod),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        productId: v.optional(v.string()),
        priceId: v.optional(v.string()),
      })
    ),
  },
  returns: v.id("subscriptions"),
  handler: async (ctx, args) => {
    const subscriptionId = await ctx.db.insert("subscriptions", {
      ...args,
      updatedAt: getCurrentTimestamp(),
    });

    // Update user with subscription reference
    const user = await ctx.db.get(args.userId);
    if (user) {
      if (args.type === "addon") {
        // For addon subscriptions, append to addonSubscriptionIds
        const existingAddonIds = user.addonSubscriptionIds ?? [];
        await ctx.db.patch(args.userId, {
          addonSubscriptionIds: [...existingAddonIds, subscriptionId],
          dodoCustomerId: args.dodoCustomerId,
          updatedAt: getCurrentTimestamp(),
        });
      } else {
        // For plan subscriptions, set subscriptionId
        await ctx.db.patch(args.userId, {
          subscriptionId,
          dodoCustomerId: args.dodoCustomerId,
          updatedAt: getCurrentTimestamp(),
        });
      }
    }

    return subscriptionId;
  },
});

/**
 * Update an existing subscription (internal)
 */
export const updateSubscription = internalMutation({
  args: {
    id: v.id("subscriptions"),
    planType: v.optional(planTypes),
    status: v.optional(subscriptionStatus),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    billingPeriod: v.optional(billingPeriod),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    metadata: v.optional(
      v.object({
        productId: v.optional(v.string()),
        priceId: v.optional(v.string()),
        cancelReason: v.optional(v.string()),
      })
    ),
  },
  returns: v.id("subscriptions"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      billingPeriod: args.billingPeriod,
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
    billingCurrency: v.optional(v.string()),
  },
  returns: v.object({
    checkout_url: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get authenticated user info from Clerk
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error(
          "User must be authenticated to create checkout session"
        );
      }

      // Extract user info from identity
      const userEmail = identity.email;
      const userName = identity.name || identity.givenName || identity.nickname;

      console.log("[Dodo] Creating checkout session with:", {
        productId: args.productId,
        quantity: args.quantity || 1,
        returnUrl: args.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
        environment: process.env.DODO_PAYMENTS_ENVIRONMENT,
        userEmail,
        userName,
      });

      const session = await checkout(ctx, {
        payload: {
          product_cart: [
            {
              product_id: args.productId,
              quantity: args.quantity || 1,
            },
          ],
          customer: {
            email: userEmail!,
            name: userName,
          },
          return_url: args.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
          billing_currency: args.billingCurrency || "USD",
          feature_flags: {
            allow_discount_code: true,
          },
        },
      });

      console.log("[Dodo] Checkout session response:", {
        hasSession: !!session,
        hasCheckoutUrl: !!session?.checkout_url,
        sessionKeys: session ? Object.keys(session) : [],
      });

      if (!session) {
        throw new Error("Checkout API returned null or undefined response");
      }

      if (!session.checkout_url) {
        console.error("[Dodo] Session object:", JSON.stringify(session));
        throw new Error(
          "Checkout session did not return a checkout_url. Check if product ID is valid in Dodo dashboard."
        );
      }

      console.log("[Dodo] Checkout session created successfully");
      return { checkout_url: session.checkout_url };
    } catch (error) {
      console.error("[Dodo] Failed to create checkout session:", {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        productId: args.productId,
        environment: process.env.DODO_PAYMENTS_ENVIRONMENT,
      });

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("product")) {
          throw new Error(
            `Invalid product ID: ${args.productId}. Please check your Dodo Payments dashboard.`
          );
        }
        if (
          error.message.includes("authentication") ||
          error.message.includes("unauthorized")
        ) {
          throw new Error(
            "Dodo Payments authentication failed. Check DODO_PAYMENTS_API_KEY in Convex dashboard."
          );
        }
        throw new Error(`Checkout failed: ${error.message}`);
      }

      throw new Error(
        "Failed to create checkout session. Check Convex logs for details."
      );
    }
  },
});

/**
 * Get customer portal URL
 */
export const getCustomerPortal = action({
  args: {},
  returns: v.object({
    portal_url: v.string(),
  }),
  handler: async (ctx) => {
    try {
      const portal = await customerPortal(ctx, {
        send_email: true,
      });

      if (!portal?.portal_url) {
        throw new Error("Customer portal did not return a portal_url");
      }

      return { portal_url: portal.portal_url };
    } catch (error) {
      console.error("[Dodo] Failed to get customer portal:", error);
      throw new Error("Failed to get customer portal");
    }
  },
});
