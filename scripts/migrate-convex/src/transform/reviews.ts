import { makeId, ReviewActivityId } from "@delulu/core";
import { epochToDate, epochToDateOr } from "../idmap";
import type { LegacyPostReview, LegacyReviewActivity } from "../legacy";
import type { TransformContext } from "./context";
import { COUNTER } from "./counters";
import { fingerprintOf } from "./fingerprint";
import type { ReviewActivityRow } from "./types";

const reviewedAtOf = (review: LegacyPostReview): number =>
  review.reviewedAt ??
  review.updatedAt ??
  review.submittedAt ??
  review._creationTime;

/** One cycling review row per post (#152): keep the latest legacy review. */
export const dedupeReviewsByPost = (
  reviews: readonly LegacyPostReview[]
): Map<string, LegacyPostReview> => {
  const byPost = new Map<string, LegacyPostReview>();
  for (const review of reviews) {
    const existing = byPost.get(review.postId);
    if (
      existing === undefined ||
      reviewedAtOf(review) >= reviewedAtOf(existing)
    ) {
      byPost.set(review.postId, review);
    }
  }
  return byPost;
};

const newStatus = (
  status: LegacyPostReview["status"]
): "pending" | "approved" | "rejected" =>
  status === "PENDING"
    ? "pending"
    : status === "REJECTED"
      ? "rejected"
      : "approved";

const lowerActivity = (type: LegacyReviewActivity["type"]): string =>
  type.toLowerCase();

export interface ReviewTransformInput {
  readonly reviewByPost: ReadonlyMap<string, LegacyPostReview>;
  readonly reviewActivity: readonly LegacyReviewActivity[];
}

/**
 * postReviews → one cycling review row per post; reviewActivity → append-only
 * feed remapped onto the surviving review. `content_fingerprint` is computed
 * over the migrated content graph; `rejectionReason` folds into the matching
 * REJECTED activity (synthesized if absent). Member fallbacks are counted.
 */
export const transformReviews = async (
  ctx: TransformContext,
  input: ReviewTransformInput
): Promise<void> => {
  const { reviewByPost, reviewActivity } = input;

  // legacy post id → new review id (activities remap onto the surviving review).
  const reviewIdByPost = new Map<string, string>();

  for (const [legacyPostId, review] of reviewByPost) {
    const postId = ctx.ids.posts.get(legacyPostId);
    const workspaceId = ctx.postWorkspaceByLegacy.get(legacyPostId);
    const content = ctx.postContentByLegacy.get(legacyPostId);
    if (
      postId === undefined ||
      workspaceId === undefined ||
      content === undefined
    ) {
      ctx.warnings.push(
        `postReviews/${review._id}: post ${legacyPostId} not migrated — review dropped`
      );
      continue;
    }
    const submittedByMemberId = ctx.authorMemberFor(
      workspaceId,
      review.submittedBy
    );
    if (submittedByMemberId === undefined) {
      ctx.warnings.push(
        `postReviews/${review._id}: no member for submittedBy in workspace — review dropped`
      );
      continue;
    }
    if (ctx.memberFor(workspaceId, review.submittedBy) === undefined) {
      ctx.counters.bump(COUNTER.reviewMemberFallback);
    }
    const reviewId = ctx.ids.reviews.getOrCreate(review._id);
    reviewIdByPost.set(legacyPostId, reviewId);

    const resolvedByMemberId =
      review.reviewedBy === undefined
        ? null
        : (ctx.authorMemberFor(workspaceId, review.reviewedBy) ?? null);
    const fingerprint = await fingerprintOf(content);

    ctx.load.postReviews.push({
      id: reviewId,
      legacyConvexId: review._id,
      workspaceId,
      postId,
      status: newStatus(review.status),
      contentFingerprint: fingerprint,
      submittedByMemberId,
      resolvedByMemberId,
      resolvedAt: epochToDate(review.reviewedAt),
      createdAt: epochToDateOr(review.submittedAt, review._creationTime),
      updatedAt: epochToDateOr(review.updatedAt, review._creationTime),
    });
  }

  // Activity feed, grouped by post so we can fold rejectionReason afterward.
  const activityByPost = new Map<string, ReviewActivityRow[]>();
  for (const activity of reviewActivity) {
    const postId = ctx.ids.posts.get(activity.postId);
    const workspaceId = ctx.postWorkspaceByLegacy.get(activity.postId);
    const reviewId = reviewIdByPost.get(activity.postId) ?? null;
    if (postId === undefined || workspaceId === undefined) {
      ctx.warnings.push(
        `reviewActivity/${activity._id}: post ${activity.postId} not migrated — activity dropped`
      );
      continue;
    }
    const actorMemberId = ctx.authorMemberFor(workspaceId, activity.userId);
    if (actorMemberId === undefined) {
      ctx.warnings.push(
        `reviewActivity/${activity._id}: no member for actor in workspace — activity dropped`
      );
      continue;
    }
    const row: ReviewActivityRow = {
      id: makeId(ReviewActivityId),
      legacyConvexId: activity._id,
      workspaceId,
      postId,
      reviewId,
      actorMemberId,
      activityType: lowerActivity(activity.type),
      comment: activity.comment ?? null,
      metadata: JSON.stringify({}),
      createdAt: epochToDateOr(activity.createdAt, activity._creationTime),
      updatedAt: epochToDateOr(activity.createdAt, activity._creationTime),
    };
    const list = activityByPost.get(activity.postId) ?? [];
    list.push(row);
    activityByPost.set(activity.postId, list);
  }

  // Fold rejectionReason into a REJECTED activity (synthesize one if absent).
  for (const [legacyPostId, review] of reviewByPost) {
    if (review.rejectionReason === undefined || review.rejectionReason === "") {
      continue;
    }
    const postId = ctx.ids.posts.get(legacyPostId);
    const workspaceId = ctx.postWorkspaceByLegacy.get(legacyPostId);
    if (postId === undefined || workspaceId === undefined) {
      continue;
    }
    const list = activityByPost.get(legacyPostId) ?? [];
    const rejected = list.find((row) => row.activityType === "rejected");
    if (rejected) {
      const withReason: ReviewActivityRow = {
        ...rejected,
        metadata: JSON.stringify({ rejectionReason: review.rejectionReason }),
      };
      list[list.indexOf(rejected)] = withReason;
    } else {
      const actorMemberId =
        (review.reviewedBy === undefined
          ? undefined
          : ctx.authorMemberFor(workspaceId, review.reviewedBy)) ??
        ctx.authorMemberFor(workspaceId, review.submittedBy);
      if (actorMemberId === undefined) {
        continue;
      }
      ctx.counters.bump(COUNTER.reviewsSynthesizedRejectedActivity);
      list.push({
        id: makeId(ReviewActivityId),
        legacyConvexId: null,
        workspaceId,
        postId,
        reviewId: reviewIdByPost.get(legacyPostId) ?? null,
        actorMemberId,
        activityType: "rejected",
        comment: null,
        metadata: JSON.stringify({ rejectionReason: review.rejectionReason }),
        createdAt:
          epochToDate(review.reviewedAt) ??
          epochToDateOr(review.updatedAt, review._creationTime),
        updatedAt: epochToDateOr(review.updatedAt, review._creationTime),
      });
    }
    activityByPost.set(legacyPostId, list);
  }

  for (const list of activityByPost.values()) {
    ctx.load.reviewActivity.push(...list);
  }
};
