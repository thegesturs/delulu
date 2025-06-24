import { and, eq } from 'drizzle-orm';
import { database } from '../../index';
import {
  accounts,
  sessions,
  userUsage,
  users,
  verifications,
} from './user.sql';

export const userQueries = {
  // User queries
  getUserById: (id: string) => {
    return database.select().from(users).where(eq(users.id, id)).limit(1);
  },

  getUserByEmail: (email: string) => {
    return database.select().from(users).where(eq(users.email, email)).limit(1);
  },

  createUser: (userData: typeof users.$inferInsert) => {
    return database.insert(users).values(userData).returning();
  },

  updateUser: (id: string, userData: Partial<typeof users.$inferInsert>) => {
    return database
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
  },

  deleteUser: (id: string) => {
    return database.delete(users).where(eq(users.id, id));
  },

  // Session queries
  getSessionByToken: (token: string) => {
    return database
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);
  },

  createSession: (sessionData: typeof sessions.$inferInsert) => {
    return database.insert(sessions).values(sessionData).returning();
  },

  deleteSession: (token: string) => {
    return database.delete(sessions).where(eq(sessions.token, token));
  },

  deleteUserSessions: (userId: string) => {
    return database.delete(sessions).where(eq(sessions.userId, userId));
  },

  // Account queries
  getAccountByProvider: (providerId: string, accountId: string) => {
    return database
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.providerId, providerId),
          eq(accounts.accountId, accountId)
        )
      )
      .limit(1);
  },

  getUserAccounts: (userId: string) => {
    return database.select().from(accounts).where(eq(accounts.userId, userId));
  },

  createAccount: (accountData: typeof accounts.$inferInsert) => {
    return database.insert(accounts).values(accountData).returning();
  },

  updateAccount: (
    id: string,
    accountData: Partial<typeof accounts.$inferInsert>
  ) => {
    return database
      .update(accounts)
      .set(accountData)
      .where(eq(accounts.id, id))
      .returning();
  },

  deleteAccount: (id: string) => {
    return database.delete(accounts).where(eq(accounts.id, id));
  },

  // Verification queries
  getVerification: (identifier: string, value: string) => {
    return database
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.identifier, identifier),
          eq(verifications.value, value)
        )
      )
      .limit(1);
  },

  createVerification: (verificationData: typeof verifications.$inferInsert) => {
    return database.insert(verifications).values(verificationData).returning();
  },

  deleteVerification: (identifier: string, value: string) => {
    return database
      .delete(verifications)
      .where(
        and(
          eq(verifications.identifier, identifier),
          eq(verifications.value, value)
        )
      );
  },

  // User Usage queries
  getUserUsage: (userId: string) => {
    return database
      .select()
      .from(userUsage)
      .where(eq(userUsage.userId, userId))
      .limit(1);
  },

  createUserUsage: (usageData: typeof userUsage.$inferInsert) => {
    return database.insert(userUsage).values(usageData).returning();
  },

  updateUserUsage: (
    userId: string,
    usageData: Partial<typeof userUsage.$inferInsert>
  ) => {
    return database
      .update(userUsage)
      .set(usageData)
      .where(eq(userUsage.userId, userId))
      .returning();
  },

  deleteUserUsage: (userId: string) => {
    return database.delete(userUsage).where(eq(userUsage.userId, userId));
  },
};
