import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { getAuthContext, getAuthContextOrThrow } from "./lib/auth";
import { assertCanApprove, canApprove } from "./lib/permissions";
import { enrichPost } from "./posts";
import { getCurrentTimestamp } from "./utils";

// ============================================================================
// Activity Helpers
// ============================================================================

async function addActivity(
  ctx: MutationCtx,
  args: {
    postId: Id<"posts">;
    reviewId: Id<"postReviews">;
    organizationId: string;
    type: "SUBMITTED" | "APPROVED" | "REJECTED" | "RESUBMITTED" | "COMMENT";
    userId: Id<"users">;
    comment?: string;
  }
) {
  await ctx.db.insert("reviewActivity", {
    postId: args.postId,
    reviewId: args.reviewId,
    organizationId: args.organizationId,
    type: args.type,
    userId: args.userId,
    comment: args.comment,
    createdAt: getCurrentTimestamp(),
  });
}

// ============================================================================
// Core Helpers
// ============================================================================

export async function submitForReviewCore(
  ctx: MutationCtx,
  postId: Id<"posts">,
  organizationId: string,
  submittedBy: Id<"users">
) {
  const now = getCurrentTimestamp();

  const existing = await ctx.db
    .query("postReviews")
    .withIndex("by_post_id", (q) => q.eq("postId", postId))
    .unique();

  let reviewId: Id<"postReviews">;

  if (existing) {
    // Reset to PENDING (re-submission after rejection)
    await ctx.db.patch(existing._id, {
      status: "PENDING",
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      submittedBy,
      submittedAt: now,
      updatedAt: now,
    });
    reviewId = existing._id;

    await addActivity(ctx, {
      postId,
      reviewId,
      organizationId,
      type: "RESUBMITTED",
      userId: submittedBy,
    });
  } else {
    reviewId = await ctx.db.insert("postReviews", {
      postId,
      organizationId,
      status: "PENDING",
      submittedBy,
      submittedAt: now,
      updatedAt: now,
    });

    await addActivity(ctx, {
      postId,
      reviewId,
      organizationId,
      type: "SUBMITTED",
      userId: submittedBy,
    });
  }

  await ctx.db.patch(postId, { reviewStatus: "PENDING" });
}

// ============================================================================
// Mutations
// ============================================================================

export const submitForReview = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authCtx = await getAuthContextOrThrow(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    if (!post.organizationId) {
      throw new Error("Approval is only required for organization posts");
    }

    await submitForReviewCore(
      ctx,
      args.postId,
      post.organizationId,
      authCtx.userId
    );
    return null;
  },
});

export const reviewPost = mutation({
  args: {
    postId: v.id("posts"),
    status: v.union(v.literal("APPROVED"), v.literal("REJECTED")),
    comment: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authCtx = await getAuthContextOrThrow(ctx);
    assertCanApprove(authCtx);

    const now = getCurrentTimestamp();

    const review = await ctx.db
      .query("postReviews")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .unique();

    if (!review) {
      throw new Error("No review record found for this post");
    }
    if (review.status !== "PENDING") {
      throw new Error("This post has already been reviewed");
    }

    await ctx.db.patch(review._id, {
      status: args.status,
      reviewedBy: authCtx.userId,
      reviewedAt: now,
      rejectionReason: args.status === "REJECTED" ? args.comment : undefined,
      updatedAt: now,
    });

    await ctx.db.patch(args.postId, { reviewStatus: args.status });

    await addActivity(ctx, {
      postId: args.postId,
      reviewId: review._id,
      organizationId: review.organizationId,
      type: args.status,
      userId: authCtx.userId,
      comment: args.comment,
    });

    return null;
  },
});

export const addReviewComment = mutation({
  args: {
    postId: v.id("posts"),
    comment: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authCtx = await getAuthContextOrThrow(ctx);

    const review = await ctx.db
      .query("postReviews")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .unique();

    if (!review) {
      throw new Error("No review record found for this post");
    }

    await addActivity(ctx, {
      postId: args.postId,
      reviewId: review._id,
      organizationId: review.organizationId,
      type: "COMMENT",
      userId: authCtx.userId,
      comment: args.comment,
    });

    return null;
  },
});

// ============================================================================
// Queries
// ============================================================================

export const getPendingReviews = query({
  args: {},
  handler: async (ctx) => {
    const authCtx = await getAuthContext(ctx);
    if (!authCtx?.organizationId) {
      return [];
    }

    // Admins see pending reviews; non-admins see their own pending submissions
    const isReviewer = canApprove(authCtx);

    const reviews = await ctx.db
      .query("postReviews")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", authCtx.organizationId!).eq("status", "PENDING")
      )
      .collect();

    // Non-admins only see their own submissions
    const filtered = isReviewer
      ? reviews
      : reviews.filter((r) => r.submittedBy === authCtx.userId);

    const enrichedReviews = await Promise.all(
      filtered.map(async (review) => {
        const post = await ctx.db.get(review.postId);
        if (!post || post.isDeleted) {
          return null;
        }

        const enrichedPost = await enrichPost(ctx, post);
        const submitter = await ctx.db.get(review.submittedBy);

        return {
          ...review,
          post: enrichedPost,
          submitterName: submitter?.name || submitter?.email || "Unknown",
          submitterImage: submitter?.image,
        };
      })
    );

    return enrichedReviews.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );
  },
});

export const getReviewForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("postReviews")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .unique();

    if (!review) {
      return null;
    }

    // Get reviewer info if reviewed
    let reviewerName: string | undefined;
    let reviewerImage: string | undefined;
    if (review.reviewedBy) {
      const reviewer = await ctx.db.get(review.reviewedBy);
      reviewerName = reviewer?.name || reviewer?.email;
      reviewerImage = reviewer?.image;
    }

    return {
      ...review,
      reviewerName,
      reviewerImage,
    };
  },
});

export const getReviewActivity = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("reviewActivity")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .collect();

    // Enrich with user info
    const enriched = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || user?.email || "Unknown",
          userImage: user?.image,
        };
      })
    );

    // Sort oldest first (timeline order)
    return enriched.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getPendingReviewCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const authCtx = await getAuthContext(ctx);
    if (!(authCtx && canApprove(authCtx) && authCtx.organizationId)) {
      return 0;
    }

    const reviews = await ctx.db
      .query("postReviews")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", authCtx.organizationId!).eq("status", "PENDING")
      )
      .collect();

    return reviews.length;
  },
});
