import { and, desc, eq } from 'drizzle-orm';
import { database } from '../../index';
import type { SocialType } from './social.sql';
import { socialProviders } from './social.sql';

export const socialQueries = {
  // Social Provider queries
  getSocialProviderById: (id: string) => {
    return database
      .select()
      .from(socialProviders)
      .where(eq(socialProviders.id, id))
      .limit(1);
  },

  getUserSocialProviders: (userId: string) => {
    return database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.userId, userId),
          eq(socialProviders.isActive, true)
        )
      )
      .orderBy(desc(socialProviders.createdAt));
  },

  getOrganizationSocialProviders: (organizationId: string) => {
    return database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.organizationId, organizationId),
          eq(socialProviders.isActive, true)
        )
      )
      .orderBy(desc(socialProviders.createdAt));
  },

  getSocialProviderByType: (userId: string, socialType: SocialType) => {
    return database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.userId, userId),
          eq(socialProviders.socialType, socialType),
          eq(socialProviders.isActive, true)
        )
      )
      .orderBy(desc(socialProviders.createdAt));
  },

  getSocialProviderByProfile: (profileId: string, organizationId?: string) => {
    const conditions = [eq(socialProviders.profileId, profileId)];
    if (organizationId) {
      conditions.push(eq(socialProviders.organizationId, organizationId));
    }
    return database
      .select()
      .from(socialProviders)
      .where(and(...conditions))
      .limit(1);
  },

  createSocialProvider: (providerData: typeof socialProviders.$inferInsert) => {
    return database.insert(socialProviders).values(providerData).returning();
  },

  updateSocialProvider: (
    id: string,
    providerData: Partial<typeof socialProviders.$inferInsert>
  ) => {
    return database
      .update(socialProviders)
      .set(providerData)
      .where(eq(socialProviders.id, id))
      .returning();
  },

  deactivateSocialProvider: (id: string) => {
    return database
      .update(socialProviders)
      .set({ isActive: false })
      .where(eq(socialProviders.id, id))
      .returning();
  },

  reactivateSocialProvider: (id: string) => {
    return database
      .update(socialProviders)
      .set({ isActive: true })
      .where(eq(socialProviders.id, id))
      .returning();
  },

  deleteSocialProvider: (id: string) => {
    return database.delete(socialProviders).where(eq(socialProviders.id, id));
  },

  updateSocialProviderSync: (id: string) => {
    return database
      .update(socialProviders)
      .set({ lastSyncedAt: new Date() })
      .where(eq(socialProviders.id, id))
      .returning();
  },

  getExpiredTokens: () => {
    return database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.isActive, true)
          // Add condition for expired tokens when needed
        )
      )
      .orderBy(desc(socialProviders.expiresIn));
  },
};
