import { defineSchema, defineTable } from 'convex/server';
import {
  baseAccountSchema,
  baseMediaTableSchema,
  basePlatformPostSchema,
  basePostSchema,
  baseSessionSchema,
  baseSocialProviderSchema,
  baseUserSchema,
  baseVerificationSchema,
} from './schemas';

export default defineSchema({
  // Users table
  users: defineTable(baseUserSchema.fields)
    .index('by_id', ['id'])
    .index('by_email', ['email']),

  // Sessions table
  sessions: defineTable(baseSessionSchema.fields)
    .index('by_id', ['id'])
    .index('by_token', ['token'])
    .index('by_user_id', ['userId']),

  // Accounts table
  accounts: defineTable(baseAccountSchema.fields)
    .index('by_id', ['id'])
    .index('by_user_id', ['userId'])
    .index('by_provider_and_account', ['providerId', 'accountId']),

  // Verifications table
  verifications: defineTable(baseVerificationSchema.fields)
    .index('by_id', ['id'])
    .index('by_identifier_and_value', ['identifier', 'value']),

  // Posts table with embedded relationships
  posts: defineTable(basePostSchema.fields)
    .index('by_id', ['id'])
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_status', ['status'])
    .index('by_scheduled_at', ['scheduledAt'])
    .index('by_created_at', ['createdAt']),

  // Social Providers table
  socialProviders: defineTable(baseSocialProviderSchema.fields)
    .index('by_id', ['id'])
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_profile_id', ['profileId'])
    .index('by_profile_id_and_user', ['profileId', 'userId'])
    .index('by_profile_id_and_organization', ['profileId', 'organizationId'])
    .index('by_social_type', ['socialType'])
    .index('by_is_active', ['isActive']),

  // Media table (unchanged, keeping external storage)
  media: defineTable(baseMediaTableSchema.fields)
    .index('by_id', ['id'])
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_bucket_key', ['bucketKey'])
    .index('by_media_type', ['mediaType'])
    .index('by_created_at', ['createdAt']),

  // Platform Posts table for tracking published posts
  platformPosts: defineTable(basePlatformPostSchema.fields)
    .index('by_post_id', ['postId'])
    .index('by_social_provider_id', ['socialProviderId'])
    .index('by_post_and_provider', ['postId', 'socialProviderId']),
});
