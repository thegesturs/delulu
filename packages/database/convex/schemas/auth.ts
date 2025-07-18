import { v } from 'convex/values';

// ============================================================================
// USER SCHEMAS
// ============================================================================

// Base user schema without system fields
export const baseUserSchema = v.object({
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  image: v.optional(v.string()),
  usage: v.object({
    socialAccounts: v.number(),
    generatedPosts: v.number(),
    drafts: v.number(),
    organization: v.number(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// User schema with system fields (for returns)
export const userSchema = v.object({
  _id: v.id('users'),
  ...baseUserSchema.fields,
});

// User creation schema (subset for mutations)
export const userCreateSchema = v.object({
  name: v.string(),
  email: v.string(),
  emailVerified: v.optional(v.boolean()),
  image: v.optional(v.string()),
});

// User update schema (partial)
export const userUpdateSchema = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerified: v.optional(v.boolean()),
  image: v.optional(v.string()),
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const baseSessionSchema = v.object({
  token: v.string(),
  userId: v.id('users'),
  expiresAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const sessionSchema = v.object({
  _id: v.id('sessions'),
  ...baseSessionSchema.fields,
});

export const sessionCreateSchema = v.object({
  token: v.string(),
  userId: v.id('users'),
  expiresAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
});

// ============================================================================
// ACCOUNT SCHEMAS
// ============================================================================

export const baseAccountSchema = v.object({
  userId: v.id('users'),
  accountId: v.string(),
  providerId: v.string(),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  idToken: v.optional(v.string()),
  accessTokenExpiresAt: v.optional(v.number()),
  refreshTokenExpiresAt: v.optional(v.number()),
  scope: v.optional(v.string()),
  password: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const accountSchema = v.object({
  _id: v.id('accounts'),
  ...baseAccountSchema.fields,
});

export const accountCreateSchema = v.object({
  userId: v.id('users'),
  accountId: v.string(),
  providerId: v.string(),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  idToken: v.optional(v.string()),
  accessTokenExpiresAt: v.optional(v.number()),
  refreshTokenExpiresAt: v.optional(v.number()),
  scope: v.optional(v.string()),
  password: v.optional(v.string()),
});

// ============================================================================
// VERIFICATION SCHEMAS
// ============================================================================

export const baseVerificationSchema = v.object({
  identifier: v.string(),
  value: v.string(),
  expiresAt: v.number(),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

export const verificationSchema = v.object({
  _id: v.id('verifications'),
  ...baseVerificationSchema.fields,
});

export const verificationCreateSchema = v.object({
  identifier: v.string(),
  value: v.string(),
  expiresAt: v.number(),
});