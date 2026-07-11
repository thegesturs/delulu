import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { MemberId, PostId, WorkspaceId } from "../kernel/ids";
import { PostContent } from "./post-group";
import {
  domainErrorFields,
  entityFields,
  JsonColumn,
  repository,
} from "./shared";

export const PostStatus = Schema.Literals([
  "draft",
  "pending_review",
  "changes_requested",
  "scheduled",
  "publishing",
  "published",
  "partially_failed",
  "failed",
]);
export type PostStatus = typeof PostStatus.Type;
export const PostSource = Schema.Literals(["app", "api", "automation"]);
export class Post extends Model.Class<Post>("Post")({
  ...entityFields(PostId),
  workspaceId: WorkspaceId,
  status: PostStatus,
  content: JsonColumn(PostContent),
  createdByMemberId: MemberId,
  source: PostSource,
  externalSubmissionId: Schema.NullOr(Schema.String),
  deletedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  publishedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class PostError extends Schema.TaggedErrorClass<PostError>()(
  "PostError",
  domainErrorFields
) {}
export const makePostRepository = Effect.fn("makePostRepository")(() =>
  repository(Post, "id", "posts", "PostRepository")
);
