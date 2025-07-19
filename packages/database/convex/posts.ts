import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  type MutationCtx,
  type QueryCtx,
  mutation,
  query,
} from './_generated/server';
import {
  alternativeContentSchema,
  contentSchema,
  getPostByIdSchema,
  paginatedPostsSchema,
  postCreateSchema,
  postFiltersSchema,
  postSchema,
  postUpdateSchema,
} from './schemas';
import { getCurrentTimestamp } from './utils';

// Helper function to get a post by ID
const findPostById = async (
  ctx: MutationCtx | QueryCtx,
  postId: Id<'posts'>
): Promise<Doc<'posts'>> => {
  const post = await ctx.db
    .query('posts')
    .withIndex('by_id', (q) => q.eq('_id', postId))
    .unique();

  if (!post) {
    throw new Error('Post not found');
  }

  return post;
};

// Post queries
export const getPostById = query({
  args: { id: v.id('posts') },
  returns: v.union(getPostByIdSchema, v.null()),
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      return null;
    }

    // Get social providers for the post
    const socialProviders = await Promise.all(
      post.socialProviderIds.map(async (id) => {
        const provider = await ctx.db.get(id);
        if (!provider) {
          return null;
        }
        return provider;
      })
    );

    // Filter out any null providers
    const validSocialProviders = socialProviders.filter(
      (p): p is NonNullable<typeof p> => p !== null
    );

    // Get alternative content with their social providers
    const alternativeContent = post.alternativeContent || [];
    const alternativeContentWithProviders = await Promise.all(
      alternativeContent.map(async (alt) => {
        const provider = await ctx.db.get(alt.socialProviderId);
        if (!provider) {
          return null;
        }
        return {
          content: alt.content,
          socialProviderId: alt.socialProviderId,
          socialProvider: provider,
        };
      })
    );

    // Filter out any null alternative content
    const validAlternativeContent = alternativeContentWithProviders.filter(
      (a): a is NonNullable<typeof a> => a !== null
    );

    return {
      ...post,
      socialProviders: validSocialProviders,
      alternativeContent: validAlternativeContent,
    };
  },
});

export const getPostsByUserId = query({
  args: {
    userId: v.id('users'),
    ...postFiltersSchema.fields,
  },
  returns: paginatedPostsSchema,
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId));

    const posts = await query.collect();

    // Filter posts based on criteria
    const filteredPosts = posts.filter((post) => {
      if (args.status && post.status !== args.status) return false;
      if (args.privacyStatus && post.privacyStatus !== args.privacyStatus)
        return false;
      if (args.reviewStatus && post.reviewStatus !== args.reviewStatus)
        return false;
      if (args.organizationId && post.organizationId !== args.organizationId)
        return false;
      if (args.isDeleted !== undefined && post.isDeleted !== args.isDeleted)
        return false;
      return true;
    });

    // Sort by creation date (newest first)
    filteredPosts.sort((a, b) => b.createdAt - a.createdAt);

    const total = filteredPosts.length;

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    return {
      posts: paginatedPosts,
      total,
    };
  },
});

export const getScheduledPosts = query({
  args: {
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(postSchema),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('posts')
      .withIndex('by_status', (q) => q.eq('status', 'SCHEDULED'));

    const posts = await query.collect();

    // Filter for future scheduled posts and optionally by organization
    const now = getCurrentTimestamp();
    const filteredPosts = posts.filter((post) => {
      if (!post.scheduledAt || post.scheduledAt <= now) return false;
      if (args.organizationId && post.organizationId !== args.organizationId)
        return false;
      return true;
    });

    // Sort by scheduled date (earliest first)
    filteredPosts.sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;

    return filteredPosts.slice(offset, offset + limit);
  },
});

export const createPost = mutation({
  args: postCreateSchema.fields,
  returns: v.id('posts'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    // Validate scheduled date if provided
    if (args.scheduledAt && args.scheduledAt <= now) {
      throw new Error('Scheduled date must be in the future');
    }

    const newPostId = await ctx.db.insert('posts', {
      userId: args.userId,
      organizationId: args.organizationId,
      status: args.status,
      scheduledAt: args.scheduledAt,
      reviewStatus: args.reviewStatus || 'PENDING',
      isDeleted: false,
      privacyStatus: args.privacyStatus || 'UNLISTED',
      content: args.content,
      alternativeContent: args.alternativeContent,
      socialProviderIds: args.socialProviderIds,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
    });

    return newPostId;
  },
});

export const updatePost = mutation({
  args: {
    id: v.id('posts'),
    ...postUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await findPostById(ctx, args.id);

    // Validate scheduled date if provided
    if (args.scheduledAt && args.scheduledAt <= getCurrentTimestamp()) {
      throw new Error('Scheduled date must be in the future');
    }

    // Patch with args and include updatedAt
    await ctx.db.patch(args.id, {
      ...args,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const softDeletePost = mutation({
  args: { id: v.id('posts') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.id);

    await ctx.db.patch(post._id, {
      isDeleted: true,
      status: 'DELETED',
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const hardDeletePost = mutation({
  args: { id: v.id('posts') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.id);
    await ctx.db.delete(post._id);
    return true;
  },
});

export const updatePostContent = mutation({
  args: {
    id: v.id('posts'),
    content: v.array(contentSchema),
    alternativeContent: v.optional(v.array(alternativeContentSchema)),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.id);

    await ctx.db.patch(post._id, {
      content: args.content,
      alternativeContent: args.alternativeContent,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const markPostAsPublished = mutation({
  args: {
    id: v.id('posts'),
    publishedAt: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.id);

    await ctx.db.patch(post._id, {
      status: 'PUBLISHED',
      publishedAt: args.publishedAt || getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const markPostAsFailed = mutation({
  args: {
    id: v.id('posts'),
    failureReason: v.string(),
    incrementRetryCount: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.id);

    const updateData: Partial<Doc<'posts'>> = {
      status: 'FAILED',
      postFailureReason: args.failureReason,
      lastFailedAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    if (args.incrementRetryCount) {
      updateData.retryCount = post.retryCount + 1;
    }

    await ctx.db.patch(post._id, updateData);

    return true;
  },
});

export const addSocialProviderToPost = mutation({
  args: {
    postId: v.id('posts'),
    socialProviderId: v.id('socialProviders'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);

    // Check if social provider is already associated
    if (post.socialProviderIds.includes(args.socialProviderId)) {
      return true; // Already associated
    }

    await ctx.db.patch(post._id, {
      socialProviderIds: [...post.socialProviderIds, args.socialProviderId],
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const removeSocialProviderFromPost = mutation({
  args: {
    postId: v.id('posts'),
    socialProviderId: v.id('socialProviders'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);

    const updatedSocialProviderIds = post.socialProviderIds.filter(
      (id) => id !== args.socialProviderId
    );

    // Also remove any alternative content for this social provider
    const updatedAlternativeContent = post.alternativeContent?.filter(
      (alt) => alt.socialProviderId !== args.socialProviderId
    );

    await ctx.db.patch(post._id, {
      socialProviderIds: updatedSocialProviderIds,
      alternativeContent: updatedAlternativeContent,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const updateAlternativeContent = mutation({
  args: {
    postId: v.id('posts'),
    socialProviderId: v.id('socialProviders'),
    content: v.array(contentSchema),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);

    const alternativeContent = post.alternativeContent || [];

    // Find existing alternative content for this social provider
    const existingIndex = alternativeContent.findIndex(
      (alt) => alt.socialProviderId === args.socialProviderId
    );

    if (existingIndex >= 0) {
      // Update existing alternative content
      alternativeContent[existingIndex] = {
        socialProviderId: args.socialProviderId,
        content: args.content,
      };
    } else {
      // Add new alternative content
      alternativeContent.push({
        socialProviderId: args.socialProviderId,
        content: args.content,
      });
    }

    await ctx.db.patch(post._id, {
      alternativeContent,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

export const removeAlternativeContent = mutation({
  args: {
    postId: v.id('posts'),
    socialProviderId: v.id('socialProviders'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);

    const updatedAlternativeContent = post.alternativeContent?.filter(
      (alt) => alt.socialProviderId !== args.socialProviderId
    );

    await ctx.db.patch(post._id, {
      alternativeContent: updatedAlternativeContent,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

// Platform Posts functions (embedded)
export const addPlatformPost = mutation({
  args: {
    postId: v.id('posts'),
    socialProviderId: v.id('socialProviders'),
    platformPostId: v.optional(v.string()),
    platformPostUrl: v.optional(v.string()),
    postedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);

    const now = getCurrentTimestamp();
    const platformPosts = post.platformPosts || [];

    // Check if platform post already exists
    const existingIndex = platformPosts.findIndex(
      (p) => p.socialProviderId === args.socialProviderId
    );

    const platformPost = {
      socialProviderId: args.socialProviderId,
      platformPostId: args.platformPostId,
      platformPostUrl: args.platformPostUrl,
      postedAt: args.postedAt,
      failureReason: args.failureReason,
      createdAt:
        existingIndex >= 0 ? platformPosts[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      platformPosts[existingIndex] = platformPost;
    } else {
      platformPosts.push(platformPost);
    }

    await ctx.db.patch(post._id, {
      platformPosts,
      updatedAt: now,
    });

    return true;
  },
});

export const getPlatformPostsByPostId = query({
  args: { postId: v.id('posts') },
  returns: v.array(
    v.object({
      socialProviderId: v.id('socialProviders'),
      platformPostId: v.optional(v.string()),
      platformPostUrl: v.optional(v.string()),
      postedAt: v.optional(v.number()),
      failureReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);
    return post?.platformPosts || [];
  },
});

export const getPlatformPost = query({
  args: { postId: v.id('posts'), socialProviderId: v.id('socialProviders') },
  returns: v.union(
    v.object({
      socialProviderId: v.id('socialProviders'),
      platformPostId: v.optional(v.string()),
      platformPostUrl: v.optional(v.string()),
      postedAt: v.optional(v.number()),
      failureReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);
    if (!post) return null;

    const platformPost = post.platformPosts?.find(
      (p) => p.socialProviderId === args.socialProviderId
    );

    return platformPost || null;
  },
});

export const updatePlatformPost = mutation({
  args: {
    postId: v.id('posts'),
    socialProviderId: v.id('socialProviders'),
    platformPostId: v.optional(v.string()),
    platformPostUrl: v.optional(v.string()),
    postedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);

    const platformPosts = post.platformPosts || [];
    const platformPostIndex = platformPosts.findIndex(
      (p) => p.socialProviderId === args.socialProviderId
    );

    if (platformPostIndex === -1) {
      throw new Error('Platform post not found');
    }

    const now = getCurrentTimestamp();
    const updatedPlatformPost = {
      ...platformPosts[platformPostIndex],
      updatedAt: now,
    };

    if (args.platformPostId !== undefined) {
      updatedPlatformPost.platformPostId = args.platformPostId;
    }
    if (args.platformPostUrl !== undefined) {
      updatedPlatformPost.platformPostUrl = args.platformPostUrl;
    }
    if (args.postedAt !== undefined) {
      updatedPlatformPost.postedAt = args.postedAt;
    }
    if (args.failureReason !== undefined) {
      updatedPlatformPost.failureReason = args.failureReason;
    }

    platformPosts[platformPostIndex] = updatedPlatformPost;

    await ctx.db.patch(post._id, {
      platformPosts,
      updatedAt: now,
    });

    return true;
  },
});

export const deletePlatformPost = mutation({
  args: { postId: v.id('posts'), socialProviderId: v.id('socialProviders') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);
    if (!post) {
      return false;
    }

    const platformPosts = post.platformPosts || [];
    const filteredPlatformPosts = platformPosts.filter(
      (p) => p.socialProviderId !== args.socialProviderId
    );

    if (filteredPlatformPosts.length === platformPosts.length) {
      return false; // Platform post not found
    }

    await ctx.db.patch(post._id, {
      platformPosts: filteredPlatformPosts,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});

// Get posts for current user with pagination (used by components)
export const getPosts = query({
  args: {
    ...postFiltersSchema.fields,
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: paginatedPostsSchema,
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

    // Use the existing getPostsByUserId logic
    const query = ctx.db
      .query('posts')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id));

    const posts = await query.collect();

    // Filter posts based on criteria
    const filteredPosts = posts.filter((post) => {
      if (args.status && post.status !== args.status) {
        return false;
      }
      if (args.privacyStatus && post.privacyStatus !== args.privacyStatus) {
        return false;
      }
      if (args.reviewStatus && post.reviewStatus !== args.reviewStatus) {
        return false;
      }
      if (args.organizationId && post.organizationId !== args.organizationId) {
        return false;
      }
      if (args.isDeleted !== undefined && post.isDeleted !== args.isDeleted) {
        return false;
      }
      if (args.isDeleted === undefined && post.isDeleted !== false) {
        return false; // Exclude deleted by default
      }
      return true;
    });

    // Sort by creation date (newest first)
    filteredPosts.sort((a, b) => b.createdAt - a.createdAt);

    const total = filteredPosts.length;

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    return {
      posts: paginatedPosts,
      total,
    };
  },
});

// Delete post by string ID (used by components)
export const deletePost = mutation({
  args: {
    postId: v.id('posts'),
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
    const post = await findPostById(ctx, args.postId);
    if (!post || post.userId !== user._id) {
      throw new Error('Post not found or access denied');
    }

    // Soft delete the post
    await ctx.db.patch(post._id, {
      isDeleted: true,
      status: 'DELETED',
      updatedAt: getCurrentTimestamp(),
    });

    return { success: true };
  },
});
