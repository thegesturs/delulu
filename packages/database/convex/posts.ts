import { type PaginationResult, paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import {
  type MutationCtx,
  type QueryCtx,
  mutation,
  query,
} from './_generated/server';

// Helper function to extract searchable text from post content
function extractSearchableText(
  content: Doc<'posts'>['content'],
  alternativeContent?: Doc<'posts'>['alternativeContent']
): string {
  const mainText = content.map((c) => c.text || '').filter(Boolean);
  const altText =
    alternativeContent
      ?.flatMap((alt) => alt.content?.map((c) => c.text || '') || [])
      .filter(Boolean) || [];

  return [...mainText, ...altText].join(' ').trim();
}
import {
  alternativeContentSchema,
  contentSchema,
  getPostByIdSchema,
  postCreateSchema,
  postFiltersSchema,
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

export const createPost = mutation({
  args: postCreateSchema.fields,
  returns: v.id('posts'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    const user = await betterAuthComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate scheduled date if provided
    if (args.scheduledAt && args.scheduledAt <= now) {
      throw new Error('Scheduled date must be in the future');
    }

    const newPostId = await ctx.db.insert('posts', {
      userId: user.userId,
      organizationId: args.organizationId,
      status: args.status,
      scheduledAt: args.scheduledAt,
      reviewStatus: args.reviewStatus || 'PENDING',
      isDeleted: false,
      privacyStatus: args.privacyStatus || 'UNLISTED',
      content: args.content,
      alternativeContent: args.alternativeContent,
      socialProviderIds: args.socialProviderIds,
      searchableText: extractSearchableText(
        args.content,
        args.alternativeContent
      ),
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
      searchableText: extractSearchableText(
        args.content,
        args.alternativeContent
      ),
      updatedAt: getCurrentTimestamp(),
    });

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
      searchableText: extractSearchableText(post.content, alternativeContent),
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

// Get posts for current user with pagination (used by components)
export const getPosts = query({
  args: {
    ...postFiltersSchema.fields,
    searchTerm: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(getPostByIdSchema),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await betterAuthComponent.getAuthUser(ctx);

    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: '',
      };
    }

    const userId = user.userId;

    console.log('>>> User', user);

    let paginationResult: PaginationResult<Doc<'posts'>>;

    // Use search index when search term is provided
    if (args.searchTerm) {
      let searchQuery = ctx.db
        .query('posts')
        .withSearchIndex('search_content', (q) => {
          let sq = q
            .search('searchableText', args.searchTerm!)
            .eq('userId', userId)
            .eq('isDeleted', args.isDeleted ?? false);

          if (args.status) {
            sq = sq.eq('status', args.status);
          }
          if (args.organizationId) {
            sq = sq.eq('organizationId', args.organizationId);
          }

          return sq;
        });

      // Apply additional filters not in search index
      if (args.privacyStatus) {
        searchQuery = searchQuery.filter((q) =>
          q.eq(q.field('privacyStatus'), args.privacyStatus)
        );
      }
      if (args.reviewStatus) {
        searchQuery = searchQuery.filter((q) =>
          q.eq(q.field('reviewStatus'), args.reviewStatus)
        );
      }

      paginationResult = await searchQuery.paginate(args.paginationOpts);
    } else {
      // Use regular index when no search term
      let query = ctx.db
        .query('posts')
        .withIndex('by_user_created', (q) => q.eq('userId', userId));

      // If we have both status and org filters, switch to the compound index
      if (args.status && args.organizationId) {
        const status = args.status;
        query = ctx.db.query('posts').withIndex('by_organization_status', (q) =>
          q
            .eq('organizationId', args.organizationId)
            .eq('status', status)
            .eq('isDeleted', args.isDeleted ?? false)
        );
      } else {
        // Apply filters individually
        if (args.status) {
          query = query.filter((q) => q.eq(q.field('status'), args.status));
        }
        if (args.organizationId) {
          query = query.filter((q) =>
            q.eq(q.field('organizationId'), args.organizationId)
          );
        }
        if (args.isDeleted !== undefined) {
          query = query.filter((q) =>
            q.eq(q.field('isDeleted'), args.isDeleted)
          );
        } else {
          query = query.filter((q) => q.eq(q.field('isDeleted'), false));
        }
      }

      // Apply remaining filters that aren't part of any index
      if (args.privacyStatus) {
        query = query.filter((q) =>
          q.eq(q.field('privacyStatus'), args.privacyStatus)
        );
      }
      if (args.reviewStatus) {
        query = query.filter((q) =>
          q.eq(q.field('reviewStatus'), args.reviewStatus)
        );
      }

      // Order by creation date (newest first) and paginate
      paginationResult = await query
        .order('desc')
        .paginate(args.paginationOpts);
    }

    console.log('>>> Pagination Result', paginationResult);

    // Enrich each post with social providers and alternative content
    const enrichedPosts = await Promise.all(
      paginationResult.page.map(async (post: Doc<'posts'>) => {
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
      })
    );

    console.log('>>> Enriched Posts', enrichedPosts);

    return {
      page: enrichedPosts,
      isDone: paginationResult.isDone,
      continueCursor: paginationResult.continueCursor,
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
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Verify ownership
    const post = await findPostById(ctx, args.postId);
    if (!post || post.userId !== (userId as Id<'users'>)) {
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

export const updatePostPublishStatus = mutation({
  args: {
    postId: v.id('posts'),
    status: v.union(v.literal('PUBLISHED'), v.literal('FAILED')),
    platformPostData: v.object({
      platformPostId: v.optional(v.string()),
      platformPostUrl: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      socialProviderId: v.id('socialProviders'),
      postedAt: v.number(),
      postId: v.id('posts'),
    }),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);
    const now = getCurrentTimestamp();

    const platformPosts = post.platformPosts || [];
    const platformPost = {
      socialProviderId: args.platformPostData.socialProviderId,
      platformPostId: args.platformPostData.platformPostId,
      platformPostUrl: args.platformPostData.platformPostUrl,
      postedAt: args.platformPostData.postedAt,
      failureReason: args.platformPostData.failureReason,
      createdAt: now,
      updatedAt: now,
    };

    // Add or update platform post
    const existingIndex = platformPosts.findIndex(
      (p) => p.socialProviderId === args.platformPostData.socialProviderId
    );
    if (existingIndex >= 0) {
      platformPosts[existingIndex] = platformPost;
    } else {
      platformPosts.push(platformPost);
    }

    // Update post status and platform posts
    await ctx.db.patch(post._id, {
      status: args.status,
      platformPosts,
      updatedAt: now,
      ...(args.status === 'PUBLISHED'
        ? { publishedAt: now }
        : { lastFailedAt: now }),
    });

    return true;
  },
});
