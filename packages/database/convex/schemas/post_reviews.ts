import { v } from "convex/values";

// ============================================================================
// POST REVIEWS SCHEMA
// ============================================================================

export const basePostReviewSchema = v.object({
  postId: v.id("posts"),
  organizationId: v.string(),
  status: v.union(
    v.literal("PENDING"),
    v.literal("APPROVED"),
    v.literal("REJECTED")
  ),
  reviewedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  submittedBy: v.id("users"),
  submittedAt: v.number(),
  updatedAt: v.number(),
});

export const postReviewSchema = v.object({
  _id: v.id("postReviews"),
  _creationTime: v.number(),
  ...basePostReviewSchema.fields,
});

// ============================================================================
// REVIEW ACTIVITY SCHEMA (Linear-style activity feed)
// ============================================================================

export const reviewActivityTypeSchema = v.union(
  v.literal("SUBMITTED"),
  v.literal("APPROVED"),
  v.literal("REJECTED"),
  v.literal("RESUBMITTED"),
  v.literal("COMMENT")
);

export const baseReviewActivitySchema = v.object({
  postId: v.id("posts"),
  reviewId: v.id("postReviews"),
  organizationId: v.string(),
  type: reviewActivityTypeSchema,
  userId: v.id("users"),
  comment: v.optional(v.string()),
  createdAt: v.number(),
});

export const reviewActivitySchema = v.object({
  _id: v.id("reviewActivity"),
  _creationTime: v.number(),
  ...baseReviewActivitySchema.fields,
});
