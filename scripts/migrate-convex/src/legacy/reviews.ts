import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyPostReview = Schema.Struct({
  ...SystemFields,
  postId: Schema.String,
  organizationId: Schema.String,
  status: Schema.Literals(["PENDING", "APPROVED", "REJECTED"]),
  reviewedBy: Schema.optional(Schema.String),
  reviewedAt: Schema.optional(Schema.Number),
  rejectionReason: Schema.optional(Schema.String),
  submittedBy: Schema.String,
  submittedAt: Schema.Number,
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyPostReview = typeof LegacyPostReview.Type;

export const LegacyReviewActivityType = Schema.Literals([
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "RESUBMITTED",
  "COMMENT",
]);
export type LegacyReviewActivityType = typeof LegacyReviewActivityType.Type;

export const LegacyReviewActivity = Schema.Struct({
  ...SystemFields,
  postId: Schema.String,
  reviewId: Schema.String,
  organizationId: Schema.String,
  type: LegacyReviewActivityType,
  userId: Schema.String,
  comment: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.Number),
});
export type LegacyReviewActivity = typeof LegacyReviewActivity.Type;
