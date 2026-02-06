import { defineSchema, defineTable } from 'convex/server';
import {
  baseAutomationLogSchema,
  baseAutomationSchema,
  baseMediaTableSchema,
  basePostSchema,
  baseSocialProviderSchema,
  baseSubscriptionSchema,
  baseTransactionSchema,
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

  // Media table (external storage with optimized indexes for pagination)
  media: defineTable(baseMediaTableSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_bucket_key', ['bucketKey'])
    .index('by_media_type', ['mediaType'])
    .index('by_created_at', ['createdAt'])
    // Composite indexes for efficient cursor-based pagination
    .index('by_userId_createdAt', ['userId', 'createdAt'])
    .index('by_userId_mediaType', ['userId', 'mediaType']),

  // Subscriptions table
  subscriptions: defineTable(baseSubscriptionSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_dodo_customer_id', ['dodoCustomerId'])
    .index('by_dodo_subscription_id', ['dodoSubscriptionId'])
    .index('by_plan_type', ['planType'])
    .index('by_status', ['status'])
    .index('by_user_status', ['userId', 'status']),

  // Transactions table for payment history
  transactions: defineTable(baseTransactionSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_subscription_id', ['subscriptionId'])
    .index('by_dodo_payment_id', ['dodoPaymentId'])
    .index('by_dodo_customer_id', ['dodoCustomerId'])
    .index('by_status', ['status'])
    .index('by_user_status', ['userId', 'status']),

  // Automations table for Instagram DM automation rules
  automations: defineTable(baseAutomationSchema.fields)
    .index('by_user_id', ['userId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_social_provider_id', ['socialProviderId'])
    .index('by_is_active', ['isActive'])
    .index('by_social_provider_active', ['socialProviderId', 'isActive']),

  // Automation logs for execution history (minimal — DM_SENT only)
  automationLogs: defineTable(baseAutomationLogSchema.fields)
    .index('by_automation_id', ['automationId'])
    .index('by_user_id', ['userId']),
});
