import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import {
  MemberId,
  PostId,
  PostReviewId,
  ReviewActivityId,
  WorkspaceId,
} from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonObject,
  repository,
} from "./shared";

export const ReviewActivityType = Schema.Literals([
  "review.submitted",
  "review.approved",
  "review.rejected",
  "review.withdrawn",
  "review.commented",
  "schedule.missed",
]);

export class ReviewActivity extends Model.Class<ReviewActivity>(
  "ReviewActivity"
)({
  ...entityFields(ReviewActivityId),
  workspaceId: WorkspaceId,
  postId: PostId,
  reviewId: Schema.NullOr(PostReviewId),
  actorMemberId: MemberId,
  activityType: ReviewActivityType,
  comment: Schema.NullOr(Schema.String),
  metadata: JsonObject,
}) {}
export class ReviewActivityError extends Schema.TaggedErrorClass<ReviewActivityError>()(
  "ReviewActivityError",
  domainErrorFields
) {}
export const makeReviewActivityRepository = Effect.fn(
  "makeReviewActivityRepository"
)(() =>
  repository(
    ReviewActivity,
    "id",
    "review_activity",
    "ReviewActivityRepository"
  )
);
