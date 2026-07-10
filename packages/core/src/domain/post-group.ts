import { Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { MediaId, PostGroupId } from "../kernel/ids";

export const MediaRef = Schema.Struct({
  id: MediaId,
  altText: Schema.optional(Schema.String),
});
export const PostSegment = Schema.Struct({
  text: Schema.String,
  media: Schema.Array(MediaRef),
  delayMinutes: Schema.optional(
    Schema.Number.check(Schema.isGreaterThanOrEqualTo(0))
  ),
});
export class PostGroup extends Model.Class<PostGroup>("PostGroup")({
  id: PostGroupId,
  isDefault: Schema.Boolean,
  segments: Schema.Array(PostSegment),
}) {}
export const PostContent = Schema.Struct({
  groups: Schema.Array(PostGroup),
}).check(
  Schema.makeFilter((content) => {
    if (content.groups.length === 0) {
      return {
        path: ["groups"],
        issue: "A post must contain at least one group",
      };
    }
    if (content.groups.filter((group) => group.isDefault).length !== 1) {
      return {
        path: ["groups"],
        issue: "A post must contain exactly one default group",
      };
    }
  })
);
