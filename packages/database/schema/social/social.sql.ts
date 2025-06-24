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

// Enums
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

// Social Providers table
export const socialProviders = pgTable(
  'social_providers',
  {
    id: varchar('id', { length: 191 }).primaryKey(),
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
  (table) => ({
    profileOrganizationUniqueIdx: unique().on(
      table.profileId,
      table.organizationId
    ),
    userProfileUniqueIdx: unique().on(table.userId, table.profileId),
    userIdIdx: index('social_providers_user_id_idx').on(table.userId),
    organizationIdIdx: index('social_providers_organization_id_idx').on(
      table.organizationId
    ),
  })
);

// Relations
export const socialProvidersRelations = relations(
  socialProviders,
  ({ many }) => ({
    // Will be connected to posts, alternateContents, and platformPosts when those are imported
  })
);
