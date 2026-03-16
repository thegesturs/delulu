import { v } from "convex/values";

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

// Plan types enum
export const planTypes = v.union(
  v.literal("FREE"),
  v.literal("VIBE"),
  v.literal("ECHO")
);

// Subscription status enum
export const subscriptionStatus = v.union(
  v.literal("ACTIVE"),
  v.literal("PAST_DUE"),
  v.literal("CANCELLED"),
  v.literal("UNPAID"),
  v.literal("TRIALING")
);

// Billing period enum
export const billingPeriod = v.union(v.literal("MONTHLY"), v.literal("YEARLY"));

// Subscription type enum (plan vs addon)
export const subscriptionType = v.union(v.literal("plan"), v.literal("addon"));

// Addon type enum
export const addonType = v.union(v.literal("sorted"));

// Transaction status enum
export const transactionStatus = v.union(
  v.literal("SUCCEEDED"),
  v.literal("PENDING"),
  v.literal("FAILED"),
  v.literal("REFUNDED")
);

// Base subscription schema
export const baseSubscriptionSchema = v.object({
  userId: v.id("users"),
  dodoCustomerId: v.string(), // Dodo Payments customer ID
  dodoSubscriptionId: v.optional(v.string()), // Dodo Payments subscription ID (optional for free plans)
  planType: planTypes,
  status: subscriptionStatus,
  type: v.optional(subscriptionType), // "plan" or "addon", optional for backward compat
  addonType: v.optional(addonType), // "sorted" etc., only set when type === "addon"
  billingPeriod: v.optional(billingPeriod), // Only for paid plans
  currentPeriodStart: v.optional(v.number()), // Timestamp
  currentPeriodEnd: v.optional(v.number()), // Timestamp
  cancelAtPeriodEnd: v.optional(v.boolean()),
  trialEnd: v.optional(v.number()), // Trial expiration timestamp
  metadata: v.optional(
    v.object({
      productId: v.optional(v.string()),
      priceId: v.optional(v.string()),
      cancelReason: v.optional(v.string()),
      isTryDelulu: v.optional(v.boolean()),
      tryDeluluScheduleId: v.optional(v.string()),
    })
  ),
  updatedAt: v.number(),
});

// Subscription schema with system fields
export const subscriptionSchema = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
  ...baseSubscriptionSchema.fields,
});

// Subscription creation schema
export const subscriptionCreateSchema = v.object({
  userId: v.id("users"),
  dodoCustomerId: v.string(),
  dodoSubscriptionId: v.optional(v.string()),
  planType: planTypes,
  status: subscriptionStatus,
  type: v.optional(subscriptionType),
  addonType: v.optional(addonType),
  billingPeriod: v.optional(billingPeriod),
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  trialEnd: v.optional(v.number()),
  metadata: v.optional(
    v.object({
      productId: v.optional(v.string()),
      priceId: v.optional(v.string()),
      cancelReason: v.optional(v.string()),
      isTryDelulu: v.optional(v.boolean()),
      tryDeluluScheduleId: v.optional(v.string()),
    })
  ),
});

// Subscription update schema (partial)
export const subscriptionUpdateSchema = v.object({
  dodoSubscriptionId: v.optional(v.string()),
  planType: v.optional(planTypes),
  status: v.optional(subscriptionStatus),
  type: v.optional(subscriptionType),
  addonType: v.optional(addonType),
  billingPeriod: v.optional(billingPeriod),
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  trialEnd: v.optional(v.number()),
  metadata: v.optional(
    v.object({
      productId: v.optional(v.string()),
      priceId: v.optional(v.string()),
      cancelReason: v.optional(v.string()),
      isTryDelulu: v.optional(v.boolean()),
      tryDeluluScheduleId: v.optional(v.string()),
    })
  ),
  updatedAt: v.optional(v.number()),
});

// ============================================================================
// TRANSACTION SCHEMAS (Optional but recommended)
// ============================================================================

// Base transaction schema for payment history
export const baseTransactionSchema = v.object({
  userId: v.id("users"),
  subscriptionId: v.optional(v.id("subscriptions")), // Link to subscription
  dodoPaymentId: v.string(), // Dodo Payments payment/transaction ID
  dodoCustomerId: v.string(),
  amount: v.number(), // Amount in cents
  currency: v.string(), // e.g., "USD"
  status: transactionStatus,
  description: v.optional(v.string()),
  receiptUrl: v.optional(v.string()),
  invoiceUrl: v.optional(v.string()),
  failureReason: v.optional(v.string()),
  metadata: v.optional(
    v.object({
      productId: v.optional(v.string()),
      priceId: v.optional(v.string()),
      webhookPayload: v.optional(v.string()), // Store raw webhook data if needed
    })
  ),
  paidAt: v.optional(v.number()), // Timestamp when payment was completed
  updatedAt: v.number(),
});

// Transaction schema with system fields
export const transactionSchema = v.object({
  _id: v.id("transactions"),
  _creationTime: v.number(),
  ...baseTransactionSchema.fields,
});

// Transaction creation schema
export const transactionCreateSchema = v.object({
  userId: v.id("users"),
  subscriptionId: v.optional(v.id("subscriptions")),
  dodoPaymentId: v.string(),
  dodoCustomerId: v.string(),
  amount: v.number(),
  currency: v.string(),
  status: transactionStatus,
  description: v.optional(v.string()),
  receiptUrl: v.optional(v.string()),
  invoiceUrl: v.optional(v.string()),
  failureReason: v.optional(v.string()),
  metadata: v.optional(
    v.object({
      productId: v.optional(v.string()),
      priceId: v.optional(v.string()),
      webhookPayload: v.optional(v.string()),
    })
  ),
  paidAt: v.optional(v.number()),
});
