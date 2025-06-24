import { pgTable, varchar, text, timestamp, boolean, integer, json, pgEnum, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const postStatusEnum = pgEnum('post_status', ['SAVED', 'PUBLISHED', 'SCHEDULED', 'DELETED', 'FAILED']);
export const postReviewStatusEnum = pgEnum('post_review_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const privacyStatusEnum = pgEnum('privacy_status', ['PUBLIC', 'PRIVATE', 'UNLISTED']);

// Posts table
export const posts = pgTable('posts', {
  id: varchar('id', { length: 191 }).primaryKey(),
  userId: varchar('user_id', { length: 256 }),
  status: postStatusEnum('status').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  reviewStatus: postReviewStatusEnum('review_status').notNull().default('PENDING'),
  organizationId: varchar('organization_id', { length: 256 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  postFailureReason: text('post_failure_reason'),
  privacyStatus: privacyStatusEnum('privacy_status').notNull().default('UNLISTED'),
  content: json('content').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  lastFailedAt: timestamp('last_failed_at', { withTimezone: true }),
  retryCount: integer('retry_count').notNull().default(0),
}, (table) => ({
  userIdIdx: index('posts_user_id_idx').on(table.userId),
  organizationIdIdx: index('posts_organization_id_idx').on(table.organizationId),
  statusScheduledIdx: index('posts_status_scheduled_idx').on(table.status, table.scheduledAt),
}));

// Alternate Post Content table
export const alternatePostContent = pgTable('alternate_post_content', {
  postId: varchar('post_id', { length: 191 }).notNull(),
  socialProviderId: varchar('social_provider_id', { length: 191 }).notNull(),
  content: json('content').notNull().default([]),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.socialProviderId] }),
  socialProviderIdIdx: index('alternate_post_content_social_provider_id_idx').on(table.socialProviderId),
}));

// Platform Posts table
export const platformPosts = pgTable('platform_posts', {
  id: varchar('id', { length: 191 }).primaryKey(),
  postId: varchar('post_id', { length: 191 }).notNull(),
  platformId: varchar('platform_id', { length: 191 }).notNull(),
  platformPostId: varchar('platform_post_id', { length: 191 }).notNull(),
  platformPostUrl: text('platform_post_url').notNull(),
}, (table) => ({
  postIdIdx: index('platform_posts_post_id_idx').on(table.postId),
  platformIdIdx: index('platform_posts_platform_id_idx').on(table.platformId),
}));

// Relations
export const postsRelations = relations(posts, ({ many }) => ({
  alternateContents: many(alternatePostContent),
  platformPosts: many(platformPosts),
}));

export const alternatePostContentRelations = relations(alternatePostContent, ({ one }) => ({
  post: one(posts, {
    fields: [alternatePostContent.postId],
    references: [posts.id],
  }),
}));

export const platformPostsRelations = relations(platformPosts, ({ one }) => ({
  post: one(posts, {
    fields: [platformPosts.postId],
    references: [posts.id],
  }),
}));

