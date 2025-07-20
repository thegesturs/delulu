import { v } from 'convex/values';
import { socialTypeSchema } from './enums';

// ============================================================================
// SOCIAL PROVIDER SCHEMAS
// ============================================================================

// Base social provider schema without system fields
export const baseSocialProviderSchema = v.object({
  organizationId: v.optional(v.string()),
  userId: v.optional(v.id('users')),
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  expiresIn: v.number(),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.string(),
  username: v.optional(v.string()),
  fullName: v.string(),
  profileImage: v.optional(v.string()),
  socialType: socialTypeSchema,
  updatedAt: v.number(),
  isActive: v.boolean(),
  lastSyncedAt: v.optional(v.number()),
});

// Social provider schema with system fields (for returns)
export const socialProviderSchema = v.object({
  _id: v.id('socialProviders'),
  _creationTime: v.number(),
  ...baseSocialProviderSchema.fields,
});

// Social provider creation schema
export const socialProviderCreateSchema = v.object({
  organizationId: v.optional(v.string()),
  userId: v.optional(v.id('users')),
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  expiresIn: v.number(),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.string(),
  username: v.optional(v.string()),
  fullName: v.string(),
  profileImage: v.optional(v.string()),
  socialType: socialTypeSchema,
  isActive: v.optional(v.boolean()),
});

// Social provider update schema (partial)
export const socialProviderUpdateSchema = v.object({
  organizationId: v.optional(v.string()),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  expiresIn: v.optional(v.number()),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.optional(v.string()),
  username: v.optional(v.string()),
  fullName: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  socialType: v.optional(socialTypeSchema),
  isActive: v.optional(v.boolean()),
});
