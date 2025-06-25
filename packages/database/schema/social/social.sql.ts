import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { alternatePostContent, platformPosts, posts } from '../post/post.sql';
import { users } from '../user/user.sql';
import { createUniqueIds } from '../utilts';

// Database enums
export const socialTypeEnum = pgEnum('social_type', [
  'TWITTER',
  'LINKEDIN',
  'LENS',
  'YOUTUBE',
  'INSTAGRAM',
  'FACEBOOK',
  'TIKTOK',
  'THREADS',
  'PINTEREST',
  'FARCASTER',
]);

export const currentPlanEnum = pgEnum('current_plan', [
  'FREE',
  'PRO',
  'PRO2',
  'PRO3',
]);

// Type-safe access derived from pgEnums
export type SocialType = (typeof socialTypeEnum.enumValues)[number];
export const SocialType = Object.fromEntries(
  socialTypeEnum.enumValues.map((value) => [value, value])
) as Record<SocialType, SocialType>;

export type CurrentPlan = (typeof currentPlanEnum.enumValues)[number];
export const CurrentPlan = Object.fromEntries(
  currentPlanEnum.enumValues.map((value) => [value, value])
) as Record<CurrentPlan, CurrentPlan>;

// Social Providers table
export const socialProviders = pgTable(
  'social_providers',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('social')),
    organizationId: varchar('organization_id', { length: 256 }),
    userId: varchar('user_id', { length: 191 }),
    clientId: varchar('client_id', { length: 191 }),
    clientSecret: varchar('client_secret', { length: 191 }),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    expiresIn: timestamp('expires_in', { withTimezone: true }).notNull(),
    refreshTokenExpiresIn: timestamp('refresh_token_expires_in', {
      withTimezone: true,
    }),
    profileId: varchar('profile_id', { length: 191 }).notNull(),
    username: varchar('username', { length: 191 }),
    fullName: varchar('full_name', { length: 191 }).notNull().default(''),
    profileImage: text('profile_image').notNull().default(''),
    socialType: socialTypeEnum('social_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  },
  (table) => [
    unique().on(table.profileId, table.organizationId),
    unique().on(table.userId, table.profileId),
    index('social_providers_user_id_idx').on(table.userId),
    index('social_providers_organization_id_idx').on(table.organizationId),
  ]
);

// Relations
export const socialProvidersRelations = relations(
  socialProviders,
  ({ one, many }) => ({
    user: one(users, {
      fields: [socialProviders.userId],
      references: [users.id],
    }),
    posts: many(posts),
    alternateContents: many(alternatePostContent),
    platformPosts: many(platformPosts),
  })
);

export const SocialProviderSelectSchema = createSelectSchema(socialProviders);

export const SocialProviderInsertSchema = createInsertSchema(socialProviders);

export type SocialProvider = z.infer<typeof SocialProviderSelectSchema>;
export type SocialProviderInsert = z.infer<typeof SocialProviderInsertSchema>;
