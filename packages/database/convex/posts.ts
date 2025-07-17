import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
  alternativeContentSchema,
  contentSchema,
  paginatedPostsSchema,
  postCreateSchema,
  postFiltersSchema,
  postSchema,
  postUpdateSchema,
} from './schemas';
import { getCurrentTimestamp } from './utils';

// Post queries
export const getPostById = query({
  args: { id: v.id('posts') },
  returns: v.union(postSchema, v.null()),
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    return post;
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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

    // Validate scheduled date if provided
    if (args.scheduledAt && args.scheduledAt <= getCurrentTimestamp()) {
      throw new Error('Scheduled date must be in the future');
    }

    const updateData: Partial<Doc<'posts'>> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.status !== undefined) updateData.status = args.status;
    if (args.scheduledAt !== undefined)
      updateData.scheduledAt = args.scheduledAt;
    if (args.reviewStatus !== undefined)
      updateData.reviewStatus = args.reviewStatus;
    if (args.privacyStatus !== undefined)
      updateData.privacyStatus = args.privacyStatus;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.alternativeContent !== undefined)
      updateData.alternativeContent = args.alternativeContent;
    if (args.socialProviderIds !== undefined)
      updateData.socialProviderIds = args.socialProviderIds;
    if (args.postFailureReason !== undefined)
      updateData.postFailureReason = args.postFailureReason;
    if (args.publishedAt !== undefined)
      updateData.publishedAt = args.publishedAt;
    if (args.lastFailedAt !== undefined)
      updateData.lastFailedAt = args.lastFailedAt;
    if (args.retryCount !== undefined) updateData.retryCount = args.retryCount;

    await ctx.db.patch(post._id, updateData);

    return true;
  },
});

export const softDeletePost = mutation({
  args: { id: v.id('posts') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

    // Delete the post (platform posts are embedded, so they get deleted automatically)
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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.postId))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if social provider is already associated
    if (post.socialProviderIds.includes(args.socialProviderId)) {
      return true; // Already associated
    }

    const updatedSocialProviderIds = [
      ...post.socialProviderIds,
      args.socialProviderId,
    ];

    await ctx.db.patch(post._id, {
      socialProviderIds: updatedSocialProviderIds,
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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.postId))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.postId))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db
      .query('posts')
      .withIndex('by_id', (q) => q.eq('_id', args.postId))
      .unique();

    if (!post) {
      throw new Error('Post not found');
    }

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
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error('Post not found');
    }

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

    await ctx.db.patch(args.postId, {
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
    const post = await ctx.db.get(args.postId);
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
    const post = await ctx.db.get(args.postId);
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
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error('Post not found');
    }

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

    await ctx.db.patch(args.postId, {
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
    const post = await ctx.db.get(args.postId);
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

    await ctx.db.patch(args.postId, {
      platformPosts: filteredPlatformPosts,
      updatedAt: getCurrentTimestamp(),
    });

    return true;
  },
});
