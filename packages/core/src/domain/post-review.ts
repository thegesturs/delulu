import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { MemberId, PostId, PostReviewId, WorkspaceId } from "../kernel/ids";
import { domainErrorFields, entityFields, repository } from "./shared";

export const ReviewStatus = Schema.Literals([
  "pending",
  "approved",
  "rejected",
]);
export class PostReview extends Model.Class<PostReview>("PostReview")({
  ...entityFields(PostReviewId),
  workspaceId: WorkspaceId,
  postId: PostId,
  status: ReviewStatus,
  contentFingerprint: Schema.String,
  submittedByMemberId: MemberId,
  resolvedByMemberId: Schema.NullOr(MemberId),
  resolvedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class PostReviewError extends Schema.TaggedErrorClass<PostReviewError>()(
  "PostReviewError",
  domainErrorFields
) {}
export const makePostReviewRepository = Effect.fn("makePostReviewRepository")(
  () => repository(PostReview, "id", "post_reviews", "PostReviewRepository")
);
