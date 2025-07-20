import { v } from 'convex/values';
import { api, internal } from './_generated/api.js';
import type { Doc } from './_generated/dataModel.js';
import type { Id } from './_generated/dataModel.js';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server.js';
import { betterAuthComponent } from './auth';
import {
  socialProviderCreateSchema,
  socialProviderSchema,
  socialProviderUpdateSchema,
} from './schemas/index';
import { decryptData, encryptData, getCurrentTimestamp } from './utils';

// Social Provider queries
export const getSocialProviderById = query({
  args: { id: v.id('socialProviders') },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();
    return provider;
  },
});

export const getUserSocialProviders = query({
  args: { userId: v.id('users') },
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

export const getConnectedAccounts = query({
  args: {},
  returns: v.array(socialProviderSchema),
  handler: async (ctx) => {
    const user = await betterAuthComponent.getAuthUser(ctx);
    console.log('>>> User', user);
    if (!user) {
      return [];
    }

    const providers = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .collect();
    console.log('>>> Providers', providers);
    // Sort by creation date (newest first)
    providers.sort((a, b) => b.createdAt - a.createdAt);

    return providers;
  },
});

// Function to delete social provider by ID (used by components)
export const deleteSocial = mutation({
  args: {
    socialId: v.id('socialProviders'),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    // Get user first
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Verify ownership
    const socialProvider = await ctx.db.get(args.socialId);
    if (!socialProvider || socialProvider.userId !== user._id) {
      throw new Error('Social provider not found or access denied');
    }

    // Use the existing deleteSocialProvider function
    await ctx.runMutation(api.social_providers.deleteSocialProvider, {
      id: args.socialId,
    });

    return { success: true };
  },
});

export const connectFacebookPage = mutation({
  args: {
    userId: v.id('users'),
    accessToken: v.string(), // Real access token from tRPC
    pageId: v.string(),
    pageName: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal('connected'), v.literal('transferred')),
  }),
  handler: async (ctx, args) => {
    // Encrypt the access token
    const encryptedAccessToken = await encryptData(args.accessToken);

    // Check if this Facebook page is already connected
    const existingProvider = await ctx.db
      .query('socialProviders')
      .withIndex('by_profile_id', (q) => q.eq('profileId', args.pageId))
      .first();

    const now = getCurrentTimestamp();
    const twoMonthsFromNow = now + 2 * 30 * 24 * 60 * 60 * 1000;

    if (existingProvider && existingProvider.userId !== args.userId) {
      // Transfer ownership
      await ctx.db.patch(existingProvider._id, {
        userId: args.userId,
        accessToken: encryptedAccessToken,
        fullName: args.pageName,
        username: args.pageName,
        profileImage: `https://graph.facebook.com/${args.pageId}/picture?type=large`,
        refreshTokenExpiresIn: twoMonthsFromNow,
        updatedAt: now,
        isActive: true,
        lastSyncedAt: now,
      });

      return { status: 'transferred' as const };
    }

    if (existingProvider && existingProvider.userId === args.userId) {
      // Update existing
      await ctx.db.patch(existingProvider._id, {
        accessToken: encryptedAccessToken,
        fullName: args.pageName,
        username: args.pageName,
        profileImage: `https://graph.facebook.com/${args.pageId}/picture?type=large`,
        refreshTokenExpiresIn: twoMonthsFromNow,
        updatedAt: now,
        isActive: true,
        lastSyncedAt: now,
      });

      return { status: 'connected' as const };
    }

    // Create new connection
    await ctx.db.insert('socialProviders', {
      userId: args.userId,
      socialType: 'FACEBOOK',
      accessToken: encryptedAccessToken,
      profileId: args.pageId,
      username: args.pageName,
      fullName: args.pageName,
      profileImage: `https://graph.facebook.com/${args.pageId}/picture?type=large`,
      isActive: true,
      lastSyncedAt: now,
      expiresIn: twoMonthsFromNow,
      refreshTokenExpiresIn: twoMonthsFromNow,
      createdAt: now,
      updatedAt: now,
    });

    return { status: 'connected' as const };
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

// Internal function to get social provider with decrypted tokens
export const getSocialProviderWithDecryptedTokens = query({
  args: { id: v.id('socialProviders') },
  returns: v.union(socialProviderSchema, v.null()),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
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

      const newSocialProviderId = await ctx.db.insert('socialProviders', {
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
    id: v.id('socialProviders'),
    ...socialProviderUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    try {
      const updateData: Partial<Doc<'socialProviders'>> = {
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
      if (args.expiresIn !== undefined) {
        updateData.expiresIn = args.expiresIn;
      }
      if (args.refreshTokenExpiresIn !== undefined) {
        updateData.refreshTokenExpiresIn = args.refreshTokenExpiresIn;
      }
      if (args.username !== undefined) {
        updateData.username = args.username;
      }
      if (args.fullName !== undefined) {
        updateData.fullName = args.fullName;
      }
      if (args.profileImage !== undefined) {
        updateData.profileImage = args.profileImage;
      }
      if (args.isActive !== undefined) {
        updateData.isActive = args.isActive;
      }

      await ctx.db.patch(provider._id, updateData);

      return true;
    } catch (error) {
      console.error('Failed to encrypt tokens during update:', error);
      throw new Error('Token encryption failed');
    }
  },
});

export const updateSocialProviderSync = mutation({
  args: { id: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
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
  handler: async (ctx) => {
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
  args: { socialProviderId: v.id('socialProviders') },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Find all posts that reference this social provider
    const posts = await ctx.db.query('posts').collect();

    let updatedPostsCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData: Partial<Doc<'posts'>> = {};

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
  args: { id: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    // Clean up posts that reference this social provider
    await ctx.runMutation(
      internal.social_providers.cleanupPostsForDeletedSocialProvider,
      {
        socialProviderId: args.id,
      }
    );

    // Delete the social provider
    await ctx.db.delete(provider._id);

    return true;
  },
});

// Upsert social provider with encrypted tokens
export const upsertSocialProvider = mutation({
  args: socialProviderCreateSchema.fields,
  returns: v.union(
    v.literal('created'),
    v.literal('account_transferred'),
    v.literal('updated')
  ),
  handler: async (ctx, args) => {
    try {
      const userId = (await betterAuthComponent.getAuthUserId(
        ctx
      )) as Id<'users'>;
      const now = getCurrentTimestamp();
      // Encrypt tokens once
      const encryptedAccessToken = await encryptData(args.accessToken);
      const encryptedRefreshToken = args.refreshToken
        ? await encryptData(args.refreshToken)
        : undefined;

      // Check if provider exists
      const existingProvider = await ctx.db
        .query('socialProviders')
        .withIndex('by_profile_id', (q) => q.eq('profileId', args.profileId))
        .unique();

      if (existingProvider) {
        // Update existing provider
        await ctx.db.patch(existingProvider._id, {
          ...args,
          userId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          updatedAt: now,
        });
        if (existingProvider.userId !== userId) {
          return 'account_transferred';
        }
        return 'updated';
      }

      // Create new provider
      await ctx.db.insert('socialProviders', {
        ...args,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        createdAt: now,
        updatedAt: now,
        isActive: args.isActive ?? true,
      });

      return 'created';
    } catch (error) {
      console.error('Failed to encrypt tokens during upsert:', error);
      throw new Error('Token encryption failed');
    }
  },
});
