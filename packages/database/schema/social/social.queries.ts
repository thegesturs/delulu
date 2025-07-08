import { and, desc, eq } from 'drizzle-orm';
import { database } from '../../index';
import { decryptData, encryptData } from '@delulu/database/encrypt';
import type { SocialType } from './social.sql';
import { socialProviders } from './social.sql';

// Types for decrypted social provider data
export interface DecryptedSocialProvider {
  id: string;
  organizationId: string | null;
  userId: string | null;
  accessToken: string; // Decrypted
  refreshToken: string | null; // Decrypted
  expiresIn: Date;
  refreshTokenExpiresIn: Date | null;
  profileId: string;
  username: string | null;
  fullName: string;
  profileImage: string;
  socialType: SocialType;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastSyncedAt: Date | null;
}

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

  /**
   * Get social provider with decrypted access and refresh tokens
   * This should be the primary function used by providers to get token data
   */
  getSocialProviderWithDecryptedTokens: async (
    id: string
  ): Promise<DecryptedSocialProvider | null> => {
    const [provider] = await database
      .select()
      .from(socialProviders)
      .where(eq(socialProviders.id, id))
      .limit(1);

    if (!provider) {
      return null;
    }

    try {
      // Decrypt tokens
      const decryptedAccessToken = await decryptData(provider.accessToken);
      const decryptedRefreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : null;

      return {
        ...provider,
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
      };
    } catch (error) {
      console.error('Failed to decrypt tokens for provider:', id, error);
      return null;
    }
  },

  /**
   * Get social provider by profile ID with decrypted tokens
   */
  getSocialProviderByProfileWithDecryptedTokens: async (
    profileId: string,
    organizationId?: string
  ): Promise<DecryptedSocialProvider | null> => {
    const conditions = [eq(socialProviders.profileId, profileId)];
    if (organizationId) {
      conditions.push(eq(socialProviders.organizationId, organizationId));
    }

    const [provider] = await database
      .select()
      .from(socialProviders)
      .where(and(...conditions))
      .limit(1);

    if (!provider) {
      return null;
    }

    try {
      // Decrypt tokens
      const decryptedAccessToken = await decryptData(provider.accessToken);
      const decryptedRefreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : null;

      return {
        ...provider,
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
      };
    } catch (error) {
      console.error('Failed to decrypt tokens for provider:', profileId, error);
      return null;
    }
  },

  /**
   * Create social provider with encrypted tokens
   */
  createSocialProviderWithEncryption: async (
    providerData: Omit<
      typeof socialProviders.$inferInsert,
      'accessToken' | 'refreshToken'
    > & {
      accessToken: string;
      refreshToken?: string | null;
    }
  ) => {
    try {
      // Encrypt tokens before storing
      const encryptedAccessToken = await encryptData(providerData.accessToken);
      const encryptedRefreshToken = providerData.refreshToken
        ? await encryptData(providerData.refreshToken)
        : null;

      return database
        .insert(socialProviders)
        .values({
          ...providerData,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
        })
        .returning();
    } catch (error) {
      console.error('Failed to encrypt tokens during creation:', error);
      throw new Error('Token encryption failed');
    }
  },

  /**
   * Update social provider with encrypted tokens
   */
  updateSocialProviderWithEncryption: async (
    id: string,
    providerData: Partial<
      Omit<typeof socialProviders.$inferInsert, 'accessToken' | 'refreshToken'>
    > & {
      accessToken?: string;
      refreshToken?: string | null;
    }
  ) => {
    try {
      const updateData = { ...providerData };

      // Encrypt tokens if they are being updated
      if (providerData.accessToken !== undefined) {
        updateData.accessToken = await encryptData(providerData.accessToken);
      }
      if (providerData.refreshToken !== undefined) {
        updateData.refreshToken = providerData.refreshToken
          ? await encryptData(providerData.refreshToken)
          : null;
      }

      return database
        .update(socialProviders)
        .set(updateData as Partial<typeof socialProviders.$inferInsert>)
        .where(eq(socialProviders.id, id))
        .returning();
    } catch (error) {
      console.error('Failed to encrypt tokens during update:', error);
      throw new Error('Token encryption failed');
    }
  },

  /**
   * Upsert social provider with encrypted tokens using conflict resolution
   * This maintains the original upsert logic while adding encryption
   */
  upsertSocialProviderWithEncryption: async (
    providerData: Omit<
      typeof socialProviders.$inferInsert,
      'accessToken' | 'refreshToken'
    > & {
      accessToken: string;
      refreshToken?: string | null;
    },
    conflictUpdateData: Partial<
      Omit<typeof socialProviders.$inferInsert, 'accessToken' | 'refreshToken'>
    > & {
      accessToken?: string;
      refreshToken?: string | null;
    }
  ) => {
    try {
      // Encrypt tokens for insertion
      const encryptedAccessToken = await encryptData(providerData.accessToken);
      const encryptedRefreshToken = providerData.refreshToken
        ? await encryptData(providerData.refreshToken)
        : null;

      // Prepare conflict update data with encryption
      const conflictUpdateDataWithEncryption = { ...conflictUpdateData };
      if (conflictUpdateData.accessToken !== undefined) {
        conflictUpdateDataWithEncryption.accessToken = await encryptData(
          conflictUpdateData.accessToken
        );
      }
      if (conflictUpdateData.refreshToken !== undefined) {
        conflictUpdateDataWithEncryption.refreshToken =
          conflictUpdateData.refreshToken
            ? await encryptData(conflictUpdateData.refreshToken)
            : null;
      }

      return database
        .insert(socialProviders)
        .values({
          ...providerData,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
        })
        .onConflictDoUpdate({
          target: [socialProviders.userId, socialProviders.profileId],
          set: conflictUpdateDataWithEncryption as Partial<
            typeof socialProviders.$inferInsert
          >,
        })
        .returning();
    } catch (error) {
      console.error('Failed to encrypt tokens during upsert:', error);
      throw new Error('Token encryption failed');
    }
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
