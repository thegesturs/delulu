import { defineSchema, defineTable } from 'convex/server';
import {
  baseMediaTableSchema,
  basePostSchema,
  baseSocialProviderSchema,
  baseUserSchema,
} from './schemas';

export default defineSchema({
  // Users table
  users: defineTable(baseUserSchema.fields)
    .index('by_email', ['email'])
    .index('by_external_id', ['externalId']),

  // Posts table with embedded relationships
  posts: defineTable(basePostSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_status', ['status'])
    .index('by_scheduled_at', ['scheduledAt'])
    .index('by_created_at', ['createdAt'])
    // Add compound index for common filter combinations
    .index('by_user_status', ['userId', 'status', 'isDeleted'])
    .index('by_organization_status', ['organizationId', 'status', 'isDeleted'])
    .index('by_user_created', ['userId', 'createdAt'])
    // Search index for full-text search
    .searchIndex('search_content', {
      searchField: 'searchableText',
      filterFields: ['userId', 'status', 'isDeleted', 'organizationId'],
    }),

  // Social Providers table
  socialProviders: defineTable(baseSocialProviderSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_profile_id', ['profileId'])
    .index('by_profile_id_and_user', ['profileId', 'userId'])
    .index('by_profile_id_and_organization', ['profileId', 'organizationId'])
    .index('by_social_type', ['socialType'])
    .index('by_is_active', ['isActive']),

  // Media table (unchanged, keeping external storage)
  media: defineTable(baseMediaTableSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_bucket_key', ['bucketKey'])
    .index('by_media_type', ['mediaType'])
    .index('by_created_at', ['createdAt']),
});
