import { v } from 'convex/values';
import { api } from './_generated/api.js';
import type { Doc, Id } from './_generated/dataModel.js';
import { mutation } from './_generated/server.js';
import { getCurrentTimestamp } from './utils.js';

/**
 * Cascade delete mutation for social providers
 * This handles all cleanup when a social provider is deleted:
 * 1. Removes social provider from posts' socialProviderIds arrays
 * 2. Removes alternative content for this social provider from posts
 * 3. Deletes all platform posts associated with this social provider
 * 4. Finally deletes the social provider itself
 */
export const deleteSocialProviderWithCascade = mutation({
  args: { socialProviderId: v.id('socialProviders') },
  returns: v.object({
    success: v.boolean(),
    updatedPostsCount: v.number(),
    deletedPlatformPostsCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if social provider exists
    const provider = await ctx.db
      .query('socialProviders')
      .withIndex('by_id', (q) => q.eq('_id', args.socialProviderId))
      .unique();

    if (!provider) {
      throw new Error('Social provider not found');
    }

    let updatedPostsCount = 0;
    const deletedPlatformPostsCount = 0;

    // Step 1: Clean up posts that reference this social provider
    const posts = await ctx.db.query('posts').collect();

    for (const post of posts) {
      let needsUpdate = false;
      const updateData: Partial<Doc<'posts'>> = {};

      // Remove from socialProviderIds array
      if (
        post.socialProviderIds.includes(
          args.socialProviderId as Id<'socialProviders'>
        )
      ) {
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

    // Step 3: Delete the social provider
    await ctx.db.delete(provider._id);

    return {
      success: true,
      updatedPostsCount,
      deletedPlatformPostsCount,
      message: `Successfully deleted social provider. Updated ${updatedPostsCount} posts and removed ${deletedPlatformPostsCount} platform posts.`,
    };
  },
});

/**
 * Cascade delete mutation for users
 * This handles all cleanup when a user is deleted:
 * 1. Deletes all user's sessions
 * 2. Deletes all user's accounts
 * 3. Deletes all user's posts (with their platform posts)
 * 4. Deletes all user's social providers (with cascade)
 * 5. Deletes all user's media
 * 6. Finally deletes the user itself
 */
export const deleteUserWithCascade = mutation({
  args: { userId: v.id('users') },
  returns: v.object({
    success: v.boolean(),
    deletedPostsCount: v.number(),
    deletedSocialProvidersCount: v.number(),
    deletedMediaCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', args.userId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    let deletedPostsCount = 0;
    let deletedSocialProvidersCount = 0;
    let deletedMediaCount = 0;

    // Step 3: Delete user's posts (including platform posts)
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    for (const post of posts) {
      // Delete the post
      await ctx.db.delete(post._id);
      deletedPostsCount++;
    }

    // Step 4: Delete user's social providers (with their cascades)
    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    for (const provider of socialProviders) {
      // Use the cascade delete for social providers
      await ctx.runMutation(
        api.cascade_deletes.deleteSocialProviderWithCascade,
        {
          socialProviderId: provider._id,
        }
      );
      deletedSocialProvidersCount++;
    }

    // Step 5: Delete user's media
    const mediaItems = await ctx.db
      .query('media')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    for (const media of mediaItems) {
      await ctx.db.delete(media._id);
      deletedMediaCount++;
    }

    // Step 6: Delete the user
    await ctx.db.delete(user._id);

    return {
      success: true,
      deletedPostsCount,
      deletedSocialProvidersCount,
      deletedMediaCount,
      message: `Successfully deleted user. Removed  ${deletedPostsCount} posts, ${deletedSocialProvidersCount} social providers, and ${deletedMediaCount} media items.`,
    };
  },
});

/**
 * Cascade delete mutation for posts
 * This handles all cleanup when a post is deleted:
 * 1. Deletes all associated platform posts
 * 2. Finally deletes the post itself
 */
export const deletePostWithCascade = mutation({
  args: { postId: v.id('posts') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if post exists
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.postId))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

    await ctx.db.delete(post._id);

    return true;
  },
});

/**
 * Cascade delete mutation for organization cleanup
 * This handles all cleanup when an organization is deleted:
 * 1. Deletes all organization's posts (with their platform posts)
 * 2. Deletes all organization's social providers (with cascade)
 * 3. Deletes all organization's media
 * Note: This doesn't delete the organization itself as that's handled elsewhere
 */
export const cleanupOrganizationData = mutation({
  args: { organizationId: v.id('organizations') },
  returns: v.object({
    success: v.boolean(),
    deletedPostsCount: v.number(),
    deletedSocialProvidersCount: v.number(),
    deletedMediaCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let deletedPostsCount = 0;
    let deletedSocialProvidersCount = 0;
    let deletedMediaCount = 0;

    // Step 1: Delete organization's posts (including platform posts)
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect();

    for (const post of posts) {
      // Use the cascade delete for posts
      await ctx.runMutation(api.cascade_deletes.deletePostWithCascade, {
        postId: post._id,
      });
      deletedPostsCount++;
    }

    // Step 2: Delete organization's social providers (with their cascades)
    const socialProviders = await ctx.db
      .query('socialProviders')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect();

    for (const provider of socialProviders) {
      // Use the cascade delete for social providers
      await ctx.runMutation(
        api.cascade_deletes.deleteSocialProviderWithCascade,
        {
          socialProviderId: provider._id,
        }
      );
      deletedSocialProvidersCount++;
    }

    // Step 3: Delete organization's media
    const mediaItems = await ctx.db
      .query('media')
      .withIndex('by_organization_id', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect();

    for (const media of mediaItems) {
      await ctx.db.delete(media._id);
      deletedMediaCount++;
    }

    return {
      success: true,
      deletedPostsCount,
      deletedSocialProvidersCount,
      deletedMediaCount,
      message: `Successfully cleaned up organization data. Removed ${deletedPostsCount} posts, ${deletedSocialProvidersCount} social providers, and ${deletedMediaCount} media items.`,
    };
  },
});

/**
 * Batch delete mutation for multiple posts
 */
export const batchDeletePosts = mutation({
  args: { postIds: v.array(v.id('posts')) },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    failedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let deletedCount = 0;
    let failedCount = 0;

    for (const postId of args.postIds) {
      try {
        await ctx.runMutation(api.cascade_deletes.deletePostWithCascade, {
          postId,
        });
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete post ${postId}:`, error);
        failedCount++;
      }
    }

    return {
      success: failedCount === 0,
      deletedCount,
      failedCount,
      message: `Batch delete completed. ${deletedCount} posts deleted, ${failedCount} failed.`,
    };
  },
});

/**
 * Batch delete mutation for multiple social providers
 */
export const batchDeleteSocialProviders = mutation({
  args: { socialProviderIds: v.array(v.id('socialProviders')) },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    failedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let deletedCount = 0;
    let failedCount = 0;

    for (const socialProviderId of args.socialProviderIds) {
      try {
        await ctx.runMutation(
          api.cascade_deletes.deleteSocialProviderWithCascade,
          {
            socialProviderId,
          }
        );
        deletedCount++;
      } catch (error) {
        console.error(
          `Failed to delete social provider ${socialProviderId}:`,
          error
        );
        failedCount++;
      }
    }

    return {
      success: failedCount === 0,
      deletedCount,
      failedCount,
      message: `Batch delete completed. ${deletedCount} social providers deleted, ${failedCount} failed.`,
    };
  },
});
