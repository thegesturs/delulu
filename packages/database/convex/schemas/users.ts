import { v } from 'convex/values';

// ============================================================================
// USER SCHEMAS
// ============================================================================

// Usage tracking schema for user limits and analytics
const usageSchema = v.object({
  socialAccounts: v.number(),
  generatedPosts: v.number(),
  drafts: v.number(),
  organization: v.number(),
});

// Base user schema without system fields
export const baseUserSchema = v.object({
  email: v.string(),
  name: v.string(),
  emailVerified: v.optional(v.boolean()),
  externalId: v.string(), // Clerk user ID
  usage: usageSchema,
  image: v.optional(v.string()),
  updatedAt: v.number(),
});

// User schema with system fields (for returns)
export const userSchema = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  ...baseUserSchema.fields,
});

// User creation schema
export const userCreateSchema = v.object({
  email: v.string(),
  name: v.string(),
  emailVerified: v.optional(v.boolean()),
  externalId: v.string(),
  usage: v.optional(usageSchema),
  image: v.optional(v.string()),
});

// User update schema (partial)
export const userUpdateSchema = v.object({
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  emailVerified: v.optional(v.boolean()),
  externalId: v.optional(v.string()),
  usage: v.optional(usageSchema),
  image: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
});