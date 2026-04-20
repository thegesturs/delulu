import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  type MutationCtx,
  mutation,
  query,
} from "./_generated/server";
import { getAuthContext, getAuthContextOrThrow } from "./lib/auth";
import { postNotification } from "./lib/notify";
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

  // Fire-and-forget: notify org admins via the Worker.
  await ctx.scheduler.runAfter(0, internal.post_reviews.notifyReviewRequested, {
    postId,
  });
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
    if (post.organizationId !== authCtx.organizationId) {
      throw new Error(
        "Not authorized to submit posts for review in this organization"
      );
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
    if (review.organizationId !== authCtx.organizationId) {
      throw new Error("Not authorized to review posts in this organization");
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
    if (review.organizationId !== authCtx.organizationId) {
      throw new Error(
        "Not authorized to comment on reviews in this organization"
      );
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

// ============================================================================
// API Queries (used by Hono REST API, no Clerk auth context)
// ============================================================================

export const apiGetReviewForPost = query({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Verify post ownership
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDeleted) {
      return null;
    }
    if (post.userId !== args.userId) {
      return null;
    }

    const review = await ctx.db
      .query("postReviews")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .unique();

    if (!review) {
      return null;
    }

    // Get reviewer info if reviewed
    let reviewerName: string | undefined;
    if (review.reviewedBy) {
      const reviewer = await ctx.db.get(review.reviewedBy);
      reviewerName = reviewer?.name || reviewer?.email;
    }

    // Get activity/comments
    const activities = await ctx.db
      .query("reviewActivity")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .collect();

    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          type: activity.type,
          comment: activity.comment,
          userName: user?.name || user?.email || "Unknown",
          createdAt: activity.createdAt,
        };
      })
    );

    return {
      status: review.status,
      rejectionReason: review.rejectionReason,
      submittedAt: review.submittedAt,
      reviewedAt: review.reviewedAt,
      reviewerName,
      activities: enrichedActivities.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

export const apiGetReviewsByOrg = query({
  args: {
    userId: v.id("users"),
    organizationId: v.string(),
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("APPROVED"),
        v.literal("REJECTED")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verify the user is a member of this org
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) =>
        q.eq("clerkOrgId", args.organizationId)
      )
      .unique();

    if (!org) {
      return [];
    }

    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", org._id).eq("userId", args.userId)
      )
      .unique();

    if (!member) {
      return [];
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: type inferred from query result
    let reviews;
    if (args.status) {
      reviews = await ctx.db
        .query("postReviews")
        .withIndex("by_organization_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", args.status!)
        )
        .collect();
    } else {
      reviews = await ctx.db
        .query("postReviews")
        .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
        .collect();
    }

    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const post = (await ctx.db.get(review.postId)) as Doc<"posts"> | null;
        if (!post || post.isDeleted) {
          return null;
        }

        const submitter = (await ctx.db.get(
          review.submittedBy
        )) as Doc<"users"> | null;
        const firstContent = post.content[0];

        return {
          reviewId: review._id,
          postId: review.postId,
          status: review.status,
          rejectionReason: review.rejectionReason,
          submittedAt: review.submittedAt,
          reviewedAt: review.reviewedAt,
          submitterName: submitter?.name || submitter?.email || "Unknown",
          postPreview: firstContent?.text?.slice(0, 200) || "",
          externalSubmissionId: post.externalSubmissionId,
        };
      })
    );

    return enrichedReviews
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.submittedAt - a.submittedAt);
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

// ============================================================================
// Notifications
// ============================================================================

/**
 * Hydrate everything the Worker needs to send a review-requested email.
 * Returns org admin emails, submitter name, and a short post preview.
 * Called by the Hono /v1/notifications/post-review-requested route.
 */
export const apiGetReviewersForPost = query({
  args: { postId: v.id("posts") },
  returns: v.union(
    v.object({
      submitterName: v.string(),
      postPreview: v.string(),
      reviewers: v.array(v.object({ email: v.string(), name: v.string() })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const post = (await ctx.db.get(args.postId)) as Doc<"posts"> | null;
    if (!post || post.isDeleted || !post.organizationId) {
      return null;
    }

    const review = await ctx.db
      .query("postReviews")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .unique();
    if (!review) {
      return null;
    }

    const submitter = (await ctx.db.get(
      review.submittedBy
    )) as Doc<"users"> | null;
    const submitterName =
      submitter?.name || submitter?.email || "A team member";

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) =>
        q.eq("clerkOrgId", post.organizationId!)
      )
      .unique();
    if (!org) {
      return null;
    }

    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", org._id))
      .collect();

    const admins = members.filter((m) => m.role === "org:admin");
    const reviewers: Array<{ email: string; name: string }> = [];
    for (const admin of admins) {
      // Don't email the submitter (e.g. admin submitting their own post)
      if (admin.userId === review.submittedBy) {
        continue;
      }
      const user = (await ctx.db.get(admin.userId)) as Doc<"users"> | null;
      if (user?.email) {
        reviewers.push({
          email: user.email,
          name: user.name || user.email,
        });
      }
    }

    const firstContent = post.content[0];
    const postPreview = (firstContent?.text ?? "").slice(0, 200);

    return { submitterName, postPreview, reviewers };
  },
});

export const notifyReviewRequested = internalAction({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (_ctx, args) => {
    await postNotification("/v1/notifications/post-review-requested", {
      postId: args.postId,
    });
    return null;
  },
});
