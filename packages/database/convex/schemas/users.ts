import { v } from "convex/values";

// ============================================================================
// USER SCHEMAS
// ============================================================================

// Stats schema for user analytics and tracking
const statsSchema = v.object({
  publishDates: v.optional(v.array(v.number())), // Array of publish dates for streak calculation
  // Extensible for future stats
});

// Usage tracking schema for user limits and analytics
const usageSchema = v.object({
  socialAccounts: v.number(),
  generatedPosts: v.number(),
  drafts: v.number(),
  organization: v.number(),
  dmsSent: v.optional(v.number()),
  transcriptionsUsed: v.optional(v.number()),
  transcriptionPeriodStart: v.optional(v.number()),
});

// Base user schema without system fields
export const baseUserSchema = v.object({
  email: v.string(),
  name: v.string(),
  emailVerified: v.optional(v.boolean()),
  externalId: v.optional(v.string()), // Clerk user ID (optional)
  usage: usageSchema,
  stats: v.optional(statsSchema), // Make stats optional for backward compatibility
  image: v.optional(v.string()),
  // Subscription-related fields
  dodoCustomerId: v.optional(v.string()), // Dodo Payments customer ID
  subscriptionId: v.optional(v.id("subscriptions")), // Link to current plan subscription
  addonSubscriptionIds: v.optional(v.array(v.id("subscriptions"))), // Links to addon subscriptions (e.g. Sorted)
  updatedAt: v.number(),
});

// User schema with system fields (for returns)
export const userSchema = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  ...baseUserSchema.fields,
});

// User creation schema
export const userCreateSchema = v.object({
  email: v.string(),
  name: v.string(),
  emailVerified: v.optional(v.boolean()),
  externalId: v.optional(v.string()),
  usage: v.optional(usageSchema),
  image: v.optional(v.string()),
  dodoCustomerId: v.optional(v.string()),
  subscriptionId: v.optional(v.id("subscriptions")),
  addonSubscriptionIds: v.optional(v.array(v.id("subscriptions"))),
});

// User update schema (partial)
export const userUpdateSchema = v.object({
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  emailVerified: v.optional(v.boolean()),
  externalId: v.optional(v.string()),
  usage: v.optional(usageSchema),
  image: v.optional(v.string()),
  dodoCustomerId: v.optional(v.string()),
  subscriptionId: v.optional(v.id("subscriptions")),
  addonSubscriptionIds: v.optional(v.array(v.id("subscriptions"))),
  updatedAt: v.optional(v.number()),
});
