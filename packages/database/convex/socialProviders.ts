import { v } from 'convex/values';
import { api } from './_generated/api';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import {
  socialProviderCreateSchema,
  socialProviderSchema,
  socialProviderUpdateSchema,
  socialTypeSchema,
} from './schemas';
import {
  createUniqueIds,
  decryptData,
  encryptData,
  getCurrentTimestamp,
} from './utils';

// Decrypted social provider type for internal use
const decryptedSocialProviderSchema = v.object({
  _id: v.id('socialProviders'),
  id: v.string(),
  organizationId: v.optional(v.string()),
  userId: v.optional(v.string()),
  accessToken: v.string(), // Decrypted
  refreshToken: v.optional(v.string()), // Decrypted
  expiresIn: v.number(),
  refreshTokenExpiresIn: v.optional(v.number()),
  profileId: v.string(),
  username: v.optional(v.string()),
  fullName: v.string(),
  profileImage: v.string(),
  socialType: socialTypeSchema,
  createdAt: v.number(),
  updatedAt: v.number(),
  isActive: v.boolean(),
  lastSyncedAt: v.optional(v.number()),
});

// Social Provider queries
export const getSocialProviderById = query({
  args: { id: v.string() },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    return provider;
  },
});

export const getUserSocialProviders = query({
  args: { userId: v.string() },
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Sort by creation date (newest first)
    providers.sort((a, b) => b.createdAt - a.createdAt);

    return providers;
  },
});

export const getOrganizationSocialProviders = query({
  args: { organizationId: v.string() },
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Sort by creation date (newest first)
    providers.sort((a, b) => b.createdAt - a.createdAt);

    return providers;
  },
});

export const getSocialProvidersByType = query({
  args: { userId: v.string(), socialType: socialTypeSchema },
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('socialType'), args.socialType),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect();

    // Sort by creation date (newest first)
    providers.sort((a, b) => b.createdAt - a.createdAt);

    return providers;
  },
});

export const getSocialProviderByProfile = query({
  args: {
    profileId: v.string(),
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    let provider;

    if (args.organizationId) {
      provider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id_and_organization', (q) =>
          q
            .eq('profileId', args.profileId)
            .eq('organizationId', args.organizationId)
        )
        .unique();
    } else if (args.userId) {
      provider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id_and_user', (q) =>
          q.eq('profileId', args.profileId).eq('userId', args.userId)
        )
        .unique();
    } else {
      provider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id', (q) => q.eq('profileId', args.profileId))
        .unique();
    }

    return provider;
  },
});

// Internal function to get social provider with decrypted tokens
export const getSocialProviderWithDecryptedTokens = internalQuery({
  args: { id: v.string() },
  returns: v.union(decryptedSocialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!provider) {
      return null;
    }

    try {
      // Decrypt tokens
      const decryptedAccessToken = await decryptData(provider.accessToken);
      const decryptedRefreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : undefined;

      return {
        ...provider,
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
      };
    } catch (error) {
      console.error('Failed to decrypt tokens for provider:', args.id, error);
      return null;
    }
  },
});

// Internal function to get social provider by profile with decrypted tokens
export const getSocialProviderByProfileWithDecryptedTokens = internalQuery({
  args: {
    profileId: v.string(),
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  returns: v.union(decryptedSocialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    let provider;

    if (args.organizationId) {
      provider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id_and_organization', (q) =>
          q
            .eq('profileId', args.profileId)
            .eq('organizationId', args.organizationId)
        )
        .unique();
    } else if (args.userId) {
      provider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id_and_user', (q) =>
          q.eq('profileId', args.profileId).eq('userId', args.userId)
        )
        .unique();
    } else {
      provider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id', (q) => q.eq('profileId', args.profileId))
        .unique();
    }

    if (!provider) {
      return null;
    }

    try {
      // Decrypt tokens
      const decryptedAccessToken = await decryptData(provider.accessToken);
      const decryptedRefreshToken = provider.refreshToken
        ? await decryptData(provider.refreshToken)
        : undefined;

      return {
        ...provider,
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
      };
    } catch (error) {
      console.error(
        'Failed to decrypt tokens for provider:',
        args.profileId,
        error
      );
      return null;
    }
  },
});

// Create social provider with encrypted tokens
export const createSocialProvider = mutation({
  args: socialProviderCreateSchema.fields,
  returns: v.id('socialProviders'),
  handler: async (ctx, args) => {
    try {
      // Encrypt tokens before storing
      const encryptedAccessToken = await encryptData(args.accessToken);
      const encryptedRefreshToken = args.refreshToken
        ? await encryptData(args.refreshToken)
        : undefined;

      const now = getCurrentTimestamp();
      const socialId = createUniqueIds('social');

      const newSocialProviderId = await ctx.db.insert('socialProviders', {
        id: socialId,
        organizationId: args.organizationId,
        userId: args.userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresIn: args.expiresIn,
        refreshTokenExpiresIn: args.refreshTokenExpiresIn,
        profileId: args.profileId,
        username: args.username,
        fullName: args.fullName,
        profileImage: args.profileImage,
        socialType: args.socialType,
        createdAt: now,
        updatedAt: now,
        isActive: args.isActive ?? true,
      });

      return newSocialProviderId;
    } catch (error) {
      console.error('Failed to encrypt tokens during creation:', error);
      throw new Error('Token encryption failed');
    }
  },
});

// Update social provider with encrypted tokens
export const updateSocialProvider = mutation({
  args: {
    id: v.string(),
    ...socialProviderUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    try {
      const updateData: any = {
        updatedAt: getCurrentTimestamp(),
      };

      // Encrypt tokens if they are being updated
      if (args.accessToken !== undefined) {
        updateData.accessToken = await encryptData(args.accessToken);
      }
      if (args.refreshToken !== undefined) {
        updateData.refreshToken = args.refreshToken
          ? await encryptData(args.refreshToken)
          : undefined;
      }

      // Update other fields
      if (args.expiresIn !== undefined) updateData.expiresIn = args.expiresIn;
      if (args.refreshTokenExpiresIn !== undefined)
        updateData.refreshTokenExpiresIn = args.refreshTokenExpiresIn;
      if (args.username !== undefined) updateData.username = args.username;
      if (args.fullName !== undefined) updateData.fullName = args.fullName;
      if (args.profileImage !== undefined)
        updateData.profileImage = args.profileImage;
      if (args.isActive !== undefined) updateData.isActive = args.isActive;

      await ctx.db.patch(provider._id, updateData);

      return true;
    } catch (error) {
      console.error('Failed to encrypt tokens during update:', error);
      throw new Error('Token encryption failed');
    }
  },
});

// Upsert social provider with encrypted tokens
export const upsertSocialProvider = mutation({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresIn: v.number(),
    refreshTokenExpiresIn: v.optional(v.number()),
    profileId: v.string(),
    username: v.optional(v.string()),
    fullName: v.string(),
    profileImage: v.string(),
    socialType: socialTypeSchema,
    isActive: v.optional(v.boolean()),
  },
  returns: v.id('socialProviders'),
  handler: async (ctx, args) => {
    try {
      // Check if provider already exists
      let existingProvider;

      if (args.organizationId) {
        existingProvider = await ctx.db
          .query('socialProviders')
          .withIndex('by_profile_id_and_organization', (q) =>
            q
              .eq('profileId', args.profileId)
              .eq('organizationId', args.organizationId)
          )
          .unique();
      } else if (args.userId) {
        existingProvider = await ctx.db
          .query('socialProviders')
          .withIndex('by_profile_id_and_user', (q) =>
            q.eq('profileId', args.profileId).eq('userId', args.userId)
          )
          .unique();
      }

      // Encrypt tokens
      const encryptedAccessToken = await encryptData(args.accessToken);
      const encryptedRefreshToken = args.refreshToken
        ? await encryptData(args.refreshToken)
        : undefined;

      const now = getCurrentTimestamp();

      if (existingProvider) {
        // Update existing provider
        await ctx.db.patch(existingProvider._id, {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresIn: args.expiresIn,
          refreshTokenExpiresIn: args.refreshTokenExpiresIn,
          username: args.username,
          fullName: args.fullName,
          profileImage: args.profileImage,
          isActive: args.isActive ?? true,
          updatedAt: now,
        });

        return existingProvider._id;
      } else {
        // Create new provider
        const socialId = createUniqueIds('social');

        const newSocialProviderId = await ctx.db.insert('socialProviders', {
          id: socialId,
          organizationId: args.organizationId,
          userId: args.userId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresIn: args.expiresIn,
          refreshTokenExpiresIn: args.refreshTokenExpiresIn,
          profileId: args.profileId,
          username: args.username,
          fullName: args.fullName,
          profileImage: args.profileImage,
          socialType: args.socialType,
          createdAt: now,
          updatedAt: now,
          isActive: args.isActive ?? true,
        });

        return newSocialProviderId;
      }
    } catch (error) {
      console.error('Failed to encrypt tokens during upsert:', error);
      throw new Error('Token encryption failed');
    }
  },
});

export const deactivateSocialProvider = mutation({
  args: { id: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    await ctx.db.patch(provider._id, {
      isActive: false,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const reactivateSocialProvider = mutation({
  args: { id: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    await ctx.db.patch(provider._id, {
      isActive: true,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const updateSocialProviderSync = mutation({
  args: { id: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    await ctx.db.patch(provider._id, {
      lastSyncedAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const getExpiredTokens = query({
  args: {},
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_is_active', (q) => q.eq('isActive', true))
      .filter((q) => q.lt(q.field('expiresIn'), now))
      .collect();

    // Sort by expiration date (oldest first)
    providers.sort((a, b) => a.expiresIn - b.expiresIn);

    return providers;
  },
});

// Internal function to clean up posts when social provider is deleted
export const cleanupPostsForDeletedSocialProvider = internalMutation({
  args: { socialProviderId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Find all posts that reference this social provider
    const posts = await ctx.db.query('posts').collect();

    let updatedPostsCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData: any = {};

      // Remove from socialProviderIds array
      if (post.socialProviderIds.includes(args.socialProviderId)) {
        updateData.socialProviderIds = post.socialProviderIds.filter(
          (id) => id !== args.socialProviderId
        );
        needsUpdate = true;
      }

      // Remove from alternativeContent array
      if (post.alternativeContent) {
        const filteredAlternativeContent = post.alternativeContent.filter(
          (alt) => alt.socialProviderId !== args.socialProviderId
        );

        if (
          filteredAlternativeContent.length !== post.alternativeContent.length
        ) {
          updateData.alternativeContent =
            filteredAlternativeContent.length > 0
              ? filteredAlternativeContent
              : undefined;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        updateData.updatedAt = getCurrentTimestamp();
        await ctx.db.patch(post._id, updateData);
        updatedPostsCount++;
      }
    }

    return updatedPostsCount;
  },
});

// Main delete function that handles cascade cleanup
export const deleteSocialProvider = mutation({
  args: { id: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    // Clean up posts that reference this social provider
    await ctx.runMutation(
      api.socialProviders.cleanupPostsForDeletedSocialProvider,
      {
        socialProviderId: args.id,
      }
    );

    // Delete associated platform posts
    const platformPosts = await ctx.db
      .query('platformPosts')
      .withIndex('by_social_provider_id', (q) =>
        q.eq('socialProviderId', args.id)
      )
      .collect();

    for (const platformPost of platformPosts) {
      await ctx.db.delete(platformPost._id);
    }

    // Delete the social provider
    await ctx.db.delete(provider._id);

    return true;
  },
});

// Helper function to get active social providers
export const getActiveSocialProviders = query({
  args: {},
  returns: v.array(socialProviderSchema),
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_is_active', (q) => q.eq('isActive', true))
      .collect();

    // Sort by creation date (newest first)
    providers.sort((a, b) => b.createdAt - a.createdAt);

    return providers;
  },
});
