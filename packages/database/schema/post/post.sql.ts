import { contentSchema } from '@delulu/validators/post';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  SocialProviderSelectSchema,
  socialProviders,
} from '../social/social.sql';
import { users } from '../user/user.sql';
import { createUniqueIds } from '../utilts';

// Enums
export const postStatusEnum = pgEnum('post_status', [
  'SAVED',
  'PUBLISHED',
  'SCHEDULED',
  'DELETED',
  'FAILED',
]);

export type PostStatus = (typeof postStatusEnum.enumValues)[number];

export const PostStatus = Object.fromEntries(
  postStatusEnum.enumValues.map((value) => [value, value])
) as Record<PostStatus, PostStatus>;

export const postReviewStatusEnum = pgEnum('post_review_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export type PostReviewStatus = (typeof postReviewStatusEnum.enumValues)[number];

export const PostReviewStatus = Object.fromEntries(
  postReviewStatusEnum.enumValues.map((value) => [value, value])
) as Record<PostReviewStatus, PostReviewStatus>;

export const privacyStatusEnum = pgEnum('privacy_status', [
  'PUBLIC',
  'PRIVATE',
  'UNLISTED',
]);

// Posts table
export const posts = pgTable(
  'posts',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('post')),
    userId: varchar('user_id', { length: 256 }),
    status: postStatusEnum('status').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    reviewStatus: postReviewStatusEnum('review_status')
      .notNull()
      .default('PENDING'),
    organizationId: varchar('organization_id', { length: 256 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    postFailureReason: text('post_failure_reason'),
    privacyStatus: privacyStatusEnum('privacy_status')
      .notNull()
      .default('UNLISTED'),
    content: json('content')
      .$type<import('@delulu/validators/post').ContentType[]>()
      .notNull()
      .default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    lastFailedAt: timestamp('last_failed_at', { withTimezone: true }),
    retryCount: integer('retry_count').notNull().default(0),
  },
  (table) => [
    index('posts_user_id_idx').on(table.userId),
    index('posts_organization_id_idx').on(table.organizationId),
  ]
);

export const PostSelectSchema = createSelectSchema(posts, {
  privacyStatus: z.enum(privacyStatusEnum.enumValues),
  status: z.enum(postStatusEnum.enumValues),
  reviewStatus: z.enum(postReviewStatusEnum.enumValues),
  content: z.array(contentSchema),
});
export const PostInsertSchema = createInsertSchema(posts, {
  privacyStatus: z.enum(privacyStatusEnum.enumValues),
  status: z.enum(postStatusEnum.enumValues),
  reviewStatus: z.enum(postReviewStatusEnum.enumValues),
  content: z.array(contentSchema),
});

export type Post = z.infer<typeof PostSelectSchema>;
export type PostInsert = z.infer<typeof PostInsertSchema>;

// Alternate Post Content table
export const alternatePostContent = pgTable(
  'alternate_post_content',
  {
    postId: varchar('post_id', { length: 191 }).notNull(),
    socialProviderId: varchar('social_provider_id', { length: 191 }).notNull(),
    content: json('content')
      .$type<import('@delulu/validators/post').ContentType[]>()
      .notNull()
      .default([]),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.socialProviderId] }),
    index('alternate_post_content_social_provider_id_idx').on(
      table.socialProviderId
    ),
    index('alternate_post_content_post_id_idx').on(table.postId),
  ]
);

export const AlternatePostContentSelectSchema = createSelectSchema(
  alternatePostContent,
  {
    content: z.array(contentSchema),
  }
);

export const AlternatePostContentInsertSchema = createInsertSchema(
  alternatePostContent,
  {
    content: z.array(contentSchema),
  }
);

export type AlternatePostContent = z.infer<
  typeof AlternatePostContentSelectSchema
>;
export type AlternatePostContentInsert = z.infer<
  typeof AlternatePostContentInsertSchema
>;

// Platform Posts table
export const platformPosts = pgTable(
  'platform_posts',
  {
    postId: varchar('post_id', { length: 191 }).notNull(),
    socialProviderId: varchar('social_provider_id', { length: 191 }).notNull(),
    platformPostId: varchar('platform_post_id', { length: 191 }),
    platformPostUrl: text('platform_post_url'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
  },
  (table) => [
    index('platform_posts_post_id_idx').on(table.postId),
    index('platform_posts_social_provider_id_idx').on(table.socialProviderId),
    primaryKey({ columns: [table.postId, table.socialProviderId] }),
  ]
);

export const PlatformPostSelectSchema = createSelectSchema(platformPosts);

export const PlatformPostInsertSchema = createInsertSchema(platformPosts);

// Posts to Social Providers join table
export const postSocialProviders = pgTable(
  'post_social_providers',
  {
    postId: varchar('post_id', { length: 191 })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    socialProviderId: varchar('social_provider_id', { length: 191 })
      .notNull()
      .references(() => socialProviders.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.socialProviderId] }),
    postIdIdx: index('post_social_providers_post_id_idx').on(t.postId),
    providerIdIdx: index('post_social_providers_provider_id_idx').on(
      t.socialProviderId
    ),
  })
);

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  alternateContents: many(alternatePostContent),
  platformPosts: many(platformPosts),
  postToSocialProviders: many(postSocialProviders),
}));

export const postSocialProvidersRelations = relations(
  postSocialProviders,
  ({ one }) => ({
    post: one(posts, {
      fields: [postSocialProviders.postId],
      references: [posts.id],
    }),
    socialProvider: one(socialProviders, {
      fields: [postSocialProviders.socialProviderId],
      references: [socialProviders.id],
    }),
  })
);

export const alternatePostContentRelations = relations(
  alternatePostContent,
  ({ one }) => ({
    post: one(posts, {
      fields: [alternatePostContent.postId],
      references: [posts.id],
    }),
    socialProvider: one(socialProviders, {
      fields: [alternatePostContent.socialProviderId],
      references: [socialProviders.id],
    }),
  })
);

export const platformPostsRelations = relations(platformPosts, ({ one }) => ({
  post: one(posts, {
    fields: [platformPosts.postId],
    references: [posts.id],
  }),
  socialProvider: one(socialProviders, {
    fields: [platformPosts.socialProviderId],
    references: [socialProviders.id],
  }),
}));

export const PostSelectSchemaWithRelations = PostSelectSchema.extend({
  alternateContents: z.array(AlternatePostContentSelectSchema),
  platformPosts: z.array(PlatformPostSelectSchema),
  postToSocialProviders: z.array(
    z.object({
      postId: z.string(),
      socialProviderId: z.string(),
      socialProvider: SocialProviderSelectSchema,
    })
  ),
});

export type PostSelectWithRelations = z.infer<
  typeof PostSelectSchemaWithRelations
>;
