import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { posts } from '../post/post.sql';
import { socialProviders } from '../social/social.sql';
import { createUniqueIds } from '../utilts';

// User table
export const users = pgTable(
  'user',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('user')),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.email)]
);

// Session table
export const sessions = pgTable(
  'session',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('session')),
    token: text('token').notNull(),
    userId: varchar('user_id', { length: 256 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.token),
    index('sessions_user_id_idx').on(table.userId),
  ]
);

// Account table
export const accounts = pgTable(
  'account',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('account')),
    userId: varchar('user_id', { length: 256 }).notNull(),
    accountId: varchar('account_id', { length: 256 }).notNull(),
    providerId: varchar('provider_id', { length: 256 }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.providerId, table.accountId),
    index('accounts_user_id_idx').on(table.userId),
  ]
);

// Verification table
export const verifications = pgTable(
  'verification',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds('verification')),
    identifier: varchar('identifier', { length: 256 }).notNull(),
    value: varchar('value', { length: 256 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.identifier, table.value)]
);

// User Usage table
export const userUsage = pgTable('user_usage', {
  userId: varchar('user_id', { length: 256 }).primaryKey(),
  socialAccounts: integer('social_accounts').notNull().default(4),
  generatedPosts: integer('generated_posts').notNull().default(50),
  drafts: integer('drafts').notNull().default(15),
  organization: integer('organization').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  userUsage: one(userUsage, {
    fields: [users.id],
    references: [userUsage.userId],
  }),
  posts: many(posts),
  socialProviders: many(socialProviders),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const userUsageRelations = relations(userUsage, ({ one }) => ({
  user: one(users, {
    fields: [userUsage.userId],
    references: [users.id],
  }),
}));
