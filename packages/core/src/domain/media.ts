import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { MediaId, WorkspaceId } from "../kernel/ids";
import {
  BigIntValue,
  domainErrorFields,
  entityFields,
  JsonColumn,
  repository,
} from "./shared";

export const MediaStatus = Schema.Literals(["pending", "ready", "failed"]);
export class Media extends Model.Class<Media>("Media")({
  ...entityFields(MediaId),
  workspaceId: WorkspaceId,
  bucketKey: Schema.String,
  url: Schema.String,
  mediaType: Schema.Literals(["image", "video", "document"]),
  mimeType: Schema.NullOr(Schema.String),
  sizeBytes: BigIntValue,
  width: Schema.NullOr(Schema.Number),
  height: Schema.NullOr(Schema.Number),
  durationSeconds: Schema.NullOr(Schema.Number),
  thumbnails: JsonColumn(Schema.Array(Schema.String)),
  altText: Schema.NullOr(Schema.String),
  status: MediaStatus,
}) {}
export class MediaError extends Schema.TaggedErrorClass<MediaError>()(
  "MediaError",
  domainErrorFields
) {}
export const makeMediaRepository = Effect.fn("makeMediaRepository")(() =>
  repository(Media, "id", "media", "MediaRepository")
);
