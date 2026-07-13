import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { MediaId, TranscriptionId, WorkspaceId } from "../kernel/ids";
import { domainErrorFields, entityFields, repository } from "./shared";

export class Transcription extends Model.Class<Transcription>("Transcription")({
  ...entityFields(TranscriptionId),
  workspaceId: WorkspaceId,
  mediaId: Schema.NullOr(MediaId),
  reelId: Schema.NullOr(Schema.String),
  reelUrl: Schema.NullOr(Schema.String),
  text: Schema.String,
  altText: Schema.NullOr(Schema.String),
  language: Schema.NullOr(Schema.String),
  durationSeconds: Schema.NullOr(Schema.Number),
}) {}
export class TranscriptionError extends Schema.TaggedErrorClass<TranscriptionError>()(
  "TranscriptionError",
  domainErrorFields
) {}
export const makeTranscriptionRepository = Effect.fn(
  "makeTranscriptionRepository"
)(() =>
  repository(Transcription, "id", "transcriptions", "TranscriptionRepository")
);
