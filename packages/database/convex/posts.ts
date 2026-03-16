import { type PaginationResult, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { postsByUserStatus } from "./stats";

/**
 * Extract all video bucket keys from post content and alternative content
 */
function extractVideoBucketKeys(post: Doc<"posts">): string[] {
  const keys: string[] = [];

  const extractFromContent = (content: Doc<"posts">["content"]) => {
    for (const item of content) {
      for (const media of item.media) {
        if (media.mediaType === "VIDEO" && media.bucketKey) {
          keys.push(media.bucketKey);
        }
      }
    }
  };

  extractFromContent(post.content);
  if (post.alternativeContent) {
    for (const alt of post.alternativeContent) {
      extractFromContent(alt.content);
    }
  }

  return [...new Set(keys)]; // deduplicate
}

// Helper function to extract searchable text from post content
function extractSearchableText(
  content: Doc<"posts">["content"],
  alternativeContent?: Doc<"posts">["alternativeContent"]
): string {
  const mainText = content.map((c) => c.text || "").filter(Boolean);
  const altText =
    alternativeContent
      ?.flatMap((alt) => alt.content?.map((c) => c.text || "") || [])
      .filter(Boolean) || [];

  return [...mainText, ...altText].join(" ").trim();
}

import {
  getPostByIdSchema,
  postCreateSchema,
  postFiltersSchema,
  postUpdateSchema,
  postUpsertSchema,
} from "./schemas";
import { getCurrentUser } from "./users";
import { getCurrentTimestamp } from "./utils";

// Helper function to get a post by ID
const findPostById = async (
  ctx: MutationCtx | QueryCtx,
  postId: Id<"posts">
): Promise<Doc<"posts">> => {
  const post = await ctx.db
    .query("posts")
    .withIndex("by_id", (q) => q.eq("_id", postId))
    .unique();

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
};

// ============================================================================
// SHARED CORE HELPERS (used by both public mutations and internal API variants)
// ============================================================================

/**
 * Enrich a post with its social providers and alternative content.
 * Shared by getPostById, getPosts, getScheduledPostsByDateRange.
 */
export async function enrichPost(ctx: QueryCtx, post: Doc<"posts">) {
  const socialProviders = await Promise.all(
    post.socialProviderIds.map(async (id) => {
      const provider = await ctx.db.get(id);
      return provider;
    })
  );

  const validSocialProviders = socialProviders.filter(
    (p): p is NonNullable<typeof p> => p !== null
  );

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

  const validAlternativeContent = alternativeContentWithProviders.filter(
    (a): a is NonNullable<typeof a> => a !== null
  );

  return {
    ...post,
    socialProviders: validSocialProviders,
    alternativeContent: validAlternativeContent,
  };
}

interface CreatePostArgs {
  organizationId?: string;
  status: Doc<"posts">["status"];
  scheduledAt?: number;
  reviewStatus?: Doc<"posts">["reviewStatus"];
  privacyStatus?: Doc<"posts">["privacyStatus"];
  content: Doc<"posts">["content"];
  alternativeContent?: Doc<"posts">["alternativeContent"];
  socialProviderIds: Id<"socialProviders">[];
  tiktokSettings?: Doc<"posts">["tiktokSettings"];
  providerSettings?: Doc<"posts">["providerSettings"];
}

export async function createPostCore(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: CreatePostArgs
): Promise<Id<"posts">> {
  const now = getCurrentTimestamp();

  if (args.scheduledAt && args.scheduledAt <= now) {
    throw new Error("Scheduled date must be in the future");
  }

  const postStatus = args.scheduledAt ? "SCHEDULED" : args.status || "SAVED";

  const newPostId = await ctx.db.insert("posts", {
    userId,
    organizationId: args.organizationId,
    status: postStatus,
    scheduledAt: args.scheduledAt,
    reviewStatus: args.reviewStatus || "PENDING",
    isDeleted: false,
    privacyStatus: args.privacyStatus || "UNLISTED",
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

  const newPost = await ctx.db.get(newPostId);
  if (newPost) {
    await postsByUserStatus.insert(ctx, newPost);
  }

  if (args.scheduledAt) {
    await ctx.scheduler.runAfter(0, internal.callmelater.schedulePostAction, {
      postId: newPostId,
      scheduledAt: args.scheduledAt,
    });
  }

  return newPostId;
}

interface UpdatePostArgs {
  status?: Doc<"posts">["status"];
  scheduledAt?: number;
  reviewStatus?: Doc<"posts">["reviewStatus"];
  privacyStatus?: Doc<"posts">["privacyStatus"];
  content?: Doc<"posts">["content"];
  alternativeContent?: Doc<"posts">["alternativeContent"];
  socialProviderIds?: Id<"socialProviders">[];
  tiktokSettings?: Doc<"posts">["tiktokSettings"];
  providerSettings?: Doc<"posts">["providerSettings"];
  postFailureReason?: string;
  publishedAt?: number;
  lastFailedAt?: number;
  retryCount?: number;
}

export async function updatePostCore(
  ctx: MutationCtx,
  postId: Id<"posts">,
  args: UpdatePostArgs
): Promise<boolean> {
  const oldPost = await findPostById(ctx, postId);

  if (args.scheduledAt && args.scheduledAt <= getCurrentTimestamp()) {
    throw new Error("Scheduled date must be in the future");
  }

  let newStatus = args.status;
  if (args.scheduledAt && !newStatus) {
    newStatus = "SCHEDULED";
  } else if (!args.scheduledAt && oldPost.status === "SCHEDULED") {
    newStatus = "SAVED";
  }

  await ctx.db.patch(postId, {
    ...args,
    ...(newStatus && { status: newStatus }),
    updatedAt: getCurrentTimestamp(),
  });

  const newPost = await ctx.db.get(postId);
  if (newPost) {
    await postsByUserStatus.replace(ctx, oldPost, newPost);
  }

  if (args.scheduledAt) {
    if (oldPost.callMeLaterScheduleId) {
      await ctx.scheduler.runAfter(
        0,
        internal.callmelater.cancelScheduleAction,
        { scheduleId: oldPost.callMeLaterScheduleId }
      );
    }
    await ctx.scheduler.runAfter(0, internal.callmelater.schedulePostAction, {
      postId,
      scheduledAt: args.scheduledAt,
    });
  }

  return true;
}

export async function softDeletePostCore(
  ctx: MutationCtx,
  postId: Id<"posts">
): Promise<boolean> {
  const oldPost = await findPostById(ctx, postId);

  if (oldPost.callMeLaterScheduleId) {
    await ctx.scheduler.runAfter(0, internal.callmelater.cancelScheduleAction, {
      scheduleId: oldPost.callMeLaterScheduleId,
    });
  }

  await ctx.db.patch(oldPost._id, {
    isDeleted: true,
    status: "DELETED",
    updatedAt: getCurrentTimestamp(),
  });

  const newPost = await ctx.db.get(postId);
  if (newPost) {
    await postsByUserStatus.replace(ctx, oldPost, newPost);
  }

  return true;
}

export async function getPostByIdCore(ctx: QueryCtx, postId: Id<"posts">) {
  const post = await ctx.db
    .query("posts")
    .withIndex("by_id", (q) => q.eq("_id", postId))
    .unique();

  if (!post) {
    return null;
  }
  return enrichPost(ctx, post);
}

export async function getPostsCore(
  ctx: QueryCtx,
  userId: Id<"users">,
  args: {
    status?: Doc<"posts">["status"];
    privacyStatus?: Doc<"posts">["privacyStatus"];
    reviewStatus?: Doc<"posts">["reviewStatus"];
    organizationId?: string;
    isDeleted?: boolean;
    searchTerm?: string;
    paginationOpts: { numItems: number; cursor: string | null };
  }
) {
  let paginationResult: PaginationResult<Doc<"posts">>;

  if (args.searchTerm) {
    let searchQuery = ctx.db
      .query("posts")
      .withSearchIndex("search_content", (q) => {
        let sq = q
          .search("searchableText", args.searchTerm!)
          .eq("userId", userId)
          .eq("isDeleted", args.isDeleted ?? false);

        if (args.status) {
          sq = sq.eq("status", args.status);
        }
        if (args.organizationId) {
          sq = sq.eq("organizationId", args.organizationId);
        }

        return sq;
      });

    if (args.privacyStatus) {
      searchQuery = searchQuery.filter((q) =>
        q.eq(q.field("privacyStatus"), args.privacyStatus)
      );
    }
    if (args.reviewStatus) {
      searchQuery = searchQuery.filter((q) =>
        q.eq(q.field("reviewStatus"), args.reviewStatus)
      );
    }

    paginationResult = await searchQuery.paginate(args.paginationOpts);
  } else {
    let query = ctx.db
      .query("posts")
      .withIndex("by_user_created", (q) => q.eq("userId", userId));

    if (args.status && args.organizationId) {
      const status = args.status;
      query = ctx.db.query("posts").withIndex("by_organization_status", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("status", status)
          .eq("isDeleted", args.isDeleted ?? false)
      );
    } else {
      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }
      if (args.organizationId) {
        query = query.filter((q) =>
          q.eq(q.field("organizationId"), args.organizationId)
        );
      }
      if (args.isDeleted === undefined) {
        query = query.filter((q) => q.eq(q.field("isDeleted"), false));
      } else {
        query = query.filter((q) => q.eq(q.field("isDeleted"), args.isDeleted));
      }
    }

    if (args.privacyStatus) {
      query = query.filter((q) =>
        q.eq(q.field("privacyStatus"), args.privacyStatus)
      );
    }
    if (args.reviewStatus) {
      query = query.filter((q) =>
        q.eq(q.field("reviewStatus"), args.reviewStatus)
      );
    }

    paginationResult = await query.order("desc").paginate(args.paginationOpts);
  }

  const enrichedPosts = await Promise.all(
    paginationResult.page.map((post) => enrichPost(ctx, post))
  );

  return {
    page: enrichedPosts,
    isDone: paginationResult.isDone,
    continueCursor: paginationResult.continueCursor,
  };
}

// ============================================================================
// PUBLIC QUERIES & MUTATIONS (Clerk-authenticated, unchanged API)
// ============================================================================

export const getPostById = query({
  args: { id: v.id("posts") },
  returns: v.union(getPostByIdSchema, v.null()),
  handler: async (ctx, args) => {
    return getPostByIdCore(ctx, args.id);
  },
});

export const createPost = mutation({
  args: postCreateSchema.fields,
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }
    return createPostCore(ctx, user._id, args);
  },
});

export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    ...postUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { id, ...updateArgs } = args;
    return updatePostCore(ctx, id, updateArgs);
  },
});

// Simple mutation to update only the scheduled time (for drag-and-drop in calendar)
export const updatePostScheduledTime = mutation({
  args: {
    id: v.id("posts"),
    scheduledAt: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const oldPost = await findPostById(ctx, args.id);

    // Validate scheduled date must be in the future (minimum 30 minutes from now)
    const minimumTime = getCurrentTimestamp() + 30 * 60 * 1000; // 30 minutes in ms
    if (args.scheduledAt < minimumTime) {
      throw new Error(
        "Scheduled date must be at least 30 minutes in the future"
      );
    }

    // Update the post with new scheduled time
    await ctx.db.patch(args.id, {
      scheduledAt: args.scheduledAt,
      status: "SCHEDULED",
      updatedAt: getCurrentTimestamp(),
    });

    // Update aggregates
    const newPost = await ctx.db.get(args.id);
    if (newPost) {
      await postsByUserStatus.replace(ctx, oldPost, newPost);
    }

    // Reschedule the post: cancel old schedule and create new one
    if (oldPost.callMeLaterScheduleId) {
      await ctx.scheduler.runAfter(
        0,
        internal.callmelater.cancelScheduleAction,
        {
          scheduleId: oldPost.callMeLaterScheduleId,
        }
      );
    }

    // Create new schedule at the new time
    await ctx.scheduler.runAfter(0, internal.callmelater.schedulePostAction, {
      postId: args.id,
      scheduledAt: args.scheduledAt,
    });

    return true;
  },
});

// Unified upsert mutation (create or update)
export const upsertPost = mutation({
  args: postUpsertSchema.fields,
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("User not found");
    }

    // Validate scheduled date if provided
    if (args.scheduledAt && args.scheduledAt <= now) {
      throw new Error("Scheduled date must be in the future");
    }

    // Determine status based on scheduling
    const finalStatus =
      args.status || (args.scheduledAt ? "SCHEDULED" : "SAVED");

    const { id, ...postData } = args;

    let postId: Id<"posts">;

    if (id) {
      // Update existing post
      const oldPost = await findPostById(ctx, id); // Verify post exists

      await ctx.db.patch(id, {
        ...postData,
        status: finalStatus,
        searchableText: extractSearchableText(
          postData.content,
          postData.alternativeContent
        ),
        updatedAt: now,
      });

      // Update aggregates
      const newPost = await ctx.db.get(id);
      if (newPost) {
        await postsByUserStatus.replace(ctx, oldPost, newPost);
      }

      postId = id;
    } else {
      // Create new post
      postId = await ctx.db.insert("posts", {
        ...postData,
        userId: user._id,
        status: finalStatus,
        reviewStatus: postData.reviewStatus || "PENDING",
        isDeleted: false,
        privacyStatus: postData.privacyStatus || "UNLISTED",
        searchableText: extractSearchableText(
          postData.content,
          postData.alternativeContent
        ),
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
      });

      // Update aggregates for new post
      const newPost = await ctx.db.get(postId);
      if (newPost) {
        await postsByUserStatus.insert(ctx, newPost);
      }
    }

    if (finalStatus === "PROCESSING") {
      // PROCESSING: Publish immediately without CallMeLater to avoid unnecessary delay
      await ctx.scheduler.runAfter(0, internal.posts.publishScheduledPost, {
        postId,
      });
    } else if (finalStatus === "SCHEDULED") {
      // SCHEDULED: Use CallMeLater for future publishing
      await ctx.scheduler.runAfter(0, internal.callmelater.schedulePostAction, {
        postId,
        scheduledAt: args.scheduledAt!,
      });
    }

    return postId;
  },
});

export const softDeletePost = mutation({
  args: { id: v.id("posts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return softDeletePostCore(ctx, args.id);
  },
});

export const hardDeletePost = mutation({
  args: { id: v.id("posts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.id);

    // Remove from aggregates before deleting
    await postsByUserStatus.delete(ctx, post);

    await ctx.db.delete(post._id);
    return true;
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
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    return getPostsCore(ctx, user._id, args);
  },
});

// Delete post by string ID (used by components)
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify ownership
    const oldPost = await findPostById(ctx, args.postId);
    if (!oldPost || oldPost.userId !== user._id) {
      throw new Error("Post not found or access denied");
    }

    await softDeletePostCore(ctx, args.postId);
    return { success: true };
  },
});

export const updatePostPublishStatus = mutation({
  args: {
    postId: v.id("posts"),
    status: v.union(v.literal("PUBLISHED"), v.literal("FAILED")),
    platformPostData: v.object({
      platformPostId: v.optional(v.string()),
      platformPostUrl: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      socialProviderId: v.id("socialProviders"),
      postedAt: v.number(),
      postId: v.id("posts"),
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
    const oldPost = { ...post };
    await ctx.db.patch(post._id, {
      status: args.status,
      platformPosts,
      updatedAt: now,
      ...(args.status === "PUBLISHED"
        ? { publishedAt: now }
        : { lastFailedAt: now }),
    });

    // Update aggregates
    const newPost = await ctx.db.get(post._id);
    if (newPost) {
      await postsByUserStatus.replace(ctx, oldPost, newPost);

      // If post was published successfully, update the user's streak
      if (args.status === "PUBLISHED" && post.userId) {
        await ctx.runMutation(internal.stats.addPublishDateInternal, {
          userId: post.userId,
          publishDate: now,
        });
      }

      // If published with a platform post ID, link to automations waiting for this post
      if (args.status === "PUBLISHED" && args.platformPostData.platformPostId) {
        await ctx.runMutation(internal.automations.linkPublishedPost, {
          convexPostId: args.postId,
          instagramMediaId: args.platformPostData.platformPostId,
          socialProviderId: args.platformPostData.socialProviderId,
        });
      }

      // Schedule video cleanup 7 days after publish
      if (args.status === "PUBLISHED") {
        const videoBucketKeys = extractVideoBucketKeys(post);
        if (videoBucketKeys.length > 0) {
          await ctx.scheduler.runAfter(
            0,
            internal.callmelater.scheduleVideoCleanupAction,
            {
              bucketKeys: videoBucketKeys,
              postId: args.postId,
            }
          );
        }
      }
    }

    return true;
  },
});

// Internal action to publish a scheduled post
export const publishScheduledPost = internalAction({
  args: { postId: v.id("posts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // Get the post with populated data - using direct query since getPostById is a regular query
      const post = await ctx.runQuery(api.posts.getPostById, {
        id: args.postId,
      });

      if (!post) {
        console.error(`Scheduled post ${args.postId} not found`);
        return false;
      }

      // Verify it's still scheduled and ready to publish
      if (post.status !== "SCHEDULED" && post.status !== "PROCESSING") {
        console.warn(
          `Post ${args.postId} is no longer scheduled (status: ${post.status})`
        );
        return false;
      }

      // Make HTTP request to Lambda URL for publishing
      const LAMBDA_URL = process.env.POSTING_LAMBDA_URL;
      const POSTING_SECRET_KEY = process.env.POSTING_SECRET_KEY;

      if (!(LAMBDA_URL && POSTING_SECRET_KEY)) {
        throw new Error(
          "POSTING_SECRET_KEY or POSTING_LAMBDA_URL environment variable not set"
        );
      }

      // Process each social provider
      for (const provider of post.socialProviders) {
        // Skip providers that are not implemented (like LENS)
        if (provider.socialType === "LENS") {
          continue;
        }

        // Find alternative content for this provider if it exists
        const alternativeContent = post.alternativeContent.find(
          (alt) => alt.socialProvider._id === provider._id
        );

        // Use alternative content if available, otherwise use default content
        const contentToPost = alternativeContent?.content ?? post.content;

        // Find provider-specific settings for this provider
        const providerSettings = post.providerSettings?.find(
          (setting) => setting.socialProviderId === provider._id
        );

        // Make HTTP request to publish
        const response = await fetch(LAMBDA_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": POSTING_SECRET_KEY,
          },
          body: JSON.stringify({
            socialType: provider.socialType,
            socialPublishInput: {
              content: contentToPost,
              postId: post._id,
              socialProviderId: provider._id,
              // Include provider-specific settings if available
              ...(providerSettings && { providerSettings }),
            },
          }),
        });

        console.log(">>> Response", await response.json());

        if (!response.ok) {
          throw new Error(
            `Failed to queue post: ${response.status} ${response.statusText}`
          );
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to publish scheduled post ${args.postId}:`, error);

      // Update post status to FAILED with error message
      await ctx.runMutation(internal.posts.updatePostStatus, {
        postId: args.postId,
        status: "FAILED",
        failureReason:
          error instanceof Error ? error.message : "Unknown error occurred",
      });

      return false;
    }
  },
});

// Helper internal mutation to update post status
export const updatePostStatus = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(
      v.literal("PUBLISHED"),
      v.literal("FAILED"),
      v.literal("SCHEDULED")
    ),
    failureReason: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    const oldPost = await ctx.db.get(args.postId);
    await ctx.db.patch(args.postId, {
      status: args.status,
      ...(args.failureReason && { postFailureReason: args.failureReason }),
      ...(args.status === "FAILED" && { lastFailedAt: now }),
      updatedAt: now,
    });
    const newPost = await ctx.db.get(args.postId);
    if (oldPost && newPost) {
      await postsByUserStatus.replace(ctx, oldPost, newPost);
    }

    return true;
  },
});

// Helper internal mutation to save CallMeLater schedule ID
export const saveCallMeLaterScheduleId = internalMutation({
  args: {
    postId: v.id("posts"),
    scheduleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      callMeLaterScheduleId: args.scheduleId,
    });
  },
});

// Get scheduled posts for a specific social provider (used by automation post selector)
export const getScheduledPostsByProvider = query({
  args: { socialProviderId: v.id("socialProviders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get posts with SCHEDULED status
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_status", (q) =>
        q
          .eq("userId", user._id)
          .eq("status", "SCHEDULED")
          .eq("isDeleted", false)
      )
      .collect();

    // Filter to posts that target this provider
    return posts
      .filter((p) => p.socialProviderIds.includes(args.socialProviderId))
      .map((p) => ({
        _id: p._id,
        content: p.content,
        scheduledAt: p.scheduledAt,
        status: p.status,
        thumbnailUrl: p.content[0]?.media?.[0]?.url,
        caption: p.content[0]?.text?.substring(0, 100),
      }));
  },
});

// Get scheduled posts within a date range (optimized for calendar view)
export const getScheduledPostsByDateRange = query({
  args: {
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
    organizationId: v.optional(v.string()),
  },
  returns: v.array(getPostByIdSchema),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return [];
    }

    // Query posts by user and filter by scheduled date range
    const query = ctx.db
      .query("posts")
      .withIndex("by_user_status", (q) =>
        q
          .eq("userId", user._id)
          .eq("status", "SCHEDULED")
          .eq("isDeleted", false)
      );

    // Filter by date range and organization
    const posts = await query
      .filter((q) => {
        let filter = q.and(
          q.gte(q.field("scheduledAt"), args.startDate),
          q.lte(q.field("scheduledAt"), args.endDate)
        );

        if (args.organizationId) {
          filter = q.and(
            filter,
            q.eq(q.field("organizationId"), args.organizationId)
          );
        }

        return filter;
      })
      .collect();

    // Populate social providers for each post
    const postsWithProviders = await Promise.all(
      posts.map((post) => enrichPost(ctx, post))
    );

    return postsWithProviders;
  },
});

// ============================================================================
// PUBLIC API VARIANTS (for REST API / MCP server)
// ============================================================================

export const apiGetPostById = query({
  args: { userId: v.id("users"), postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await getPostByIdCore(ctx, args.postId);
    if (!post || post.userId !== args.userId) {
      return null;
    }
    return post;
  },
});

export const apiGetPosts = query({
  args: {
    userId: v.id("users"),
    status: postFiltersSchema.fields.status,
    isDeleted: v.optional(v.boolean()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    return getPostsCore(ctx, userId, rest);
  },
});

export const apiCreatePost = mutation({
  args: {
    userId: v.id("users"),
    organizationId: postCreateSchema.fields.organizationId,
    status: postCreateSchema.fields.status,
    scheduledAt: postCreateSchema.fields.scheduledAt,
    reviewStatus: postCreateSchema.fields.reviewStatus,
    privacyStatus: postCreateSchema.fields.privacyStatus,
    content: postCreateSchema.fields.content,
    alternativeContent: postCreateSchema.fields.alternativeContent,
    socialProviderIds: postCreateSchema.fields.socialProviderIds,
    tiktokSettings: postCreateSchema.fields.tiktokSettings,
    providerSettings: postCreateSchema.fields.providerSettings,
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const { userId, ...createArgs } = args;
    return createPostCore(ctx, userId, createArgs);
  },
});

export const apiUpdatePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
    ...postUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { userId, postId, ...updateArgs } = args;
    // Verify ownership
    const post = await findPostById(ctx, postId);
    if (post.userId !== userId) {
      throw new Error("Post not found or access denied");
    }
    return updatePostCore(ctx, postId, updateArgs);
  },
});

export const apiSoftDeletePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await findPostById(ctx, args.postId);
    if (post.userId !== args.userId) {
      throw new Error("Post not found or access denied");
    }
    return softDeletePostCore(ctx, args.postId);
  },
});
