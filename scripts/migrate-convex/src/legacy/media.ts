import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyMediaType = Schema.Literals(["IMAGE", "VIDEO", "DOCUMENT"]);
export type LegacyMediaType = typeof LegacyMediaType.Type;

export const LegacyMedia = Schema.Struct({
  ...SystemFields,
  userId: Schema.String,
  organizationId: Schema.optional(Schema.String),
  bucketKey: Schema.String,
  url: Schema.String,
  mediaType: LegacyMediaType,
  originalFilename: Schema.optional(Schema.String),
  size: Schema.optional(Schema.Number),
  extension: Schema.optional(Schema.String),
  altText: Schema.optional(Schema.String),
  bucketUrl: Schema.optional(Schema.String),
  thumbnailBucketUrl: Schema.optional(Schema.String),
  thumbnailBucketKey: Schema.optional(Schema.String),
  thumbnailTimestamp: Schema.optional(Schema.Number),
  createdAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyMedia = typeof LegacyMedia.Type;
