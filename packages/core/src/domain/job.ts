import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { JobId, MediaId, PostTargetId, WorkspaceId } from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonColumn,
  repository,
} from "./shared";

export const JobStatus = Schema.Literals([
  "pending",
  "leased",
  "dispatched",
  "completed",
  "failed",
]);
export type JobStatus = typeof JobStatus.Type;

export const JobPayload = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("PublishTarget"),
    targetId: PostTargetId,
  }),
  Schema.Struct({
    _tag: Schema.Literal("DeleteMediaObject"),
    mediaId: MediaId,
  }),
  Schema.Struct({ _tag: Schema.Literal("ReclaimMedia"), mediaId: MediaId }),
  Schema.Struct({ _tag: Schema.Literal("SweepPendingMedia") }),
  Schema.Struct({
    _tag: Schema.Literal("MirrorClerkMembership"),
    organizationId: Schema.String,
    externalUserId: Schema.String,
    action: Schema.Literals(["update", "remove"]),
    role: Schema.optional(Schema.String),
  }),
]);
export type JobPayload = typeof JobPayload.Type;

export class Job extends Model.Class<Job>("Job")({
  ...entityFields(JobId),
  workspaceId: WorkspaceId,
  payload: JsonColumn(JobPayload),
  runAt: Schema.DateTimeUtcFromDate,
  status: JobStatus,
  attempts: Schema.Number,
  maxAttempts: Schema.Number,
  lockedUntil: Schema.NullOr(Schema.DateTimeUtcFromDate),
  lastError: Schema.NullOr(Schema.String),
  idempotencyKey: Schema.String,
}) {}

export class JobError extends Schema.TaggedErrorClass<JobError>()(
  "JobError",
  domainErrorFields
) {}

export const makeJobRepository = Effect.fn("makeJobRepository")(() =>
  repository(Job, "id", "jobs", "JobRepository")
);
