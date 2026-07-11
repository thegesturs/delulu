import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyTranscription = Schema.Struct({
  ...SystemFields,
  userId: Schema.String,
  reelId: Schema.String,
  reelUrl: Schema.String,
  text: Schema.String,
  altText: Schema.optional(Schema.String),
  language: Schema.String,
  durationSeconds: Schema.Number,
  createdAt: Schema.optional(Schema.Number),
});
export type LegacyTranscription = typeof LegacyTranscription.Type;
