import { Schema } from "effect";
import { MediaId, PostTargetId } from "../kernel/ids";
import { domainErrorFields } from "./shared";

export const JobPayload = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("DeliverMessage"),
    messageId: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("BillingReconcile"),
    ownerId: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("ExpireReservation"),
    reservationId: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("CancellationDeadline"),
    requestId: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("LifecycleDeadline"),
    ownerId: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RepairAutomation"),
    profileId: Schema.String,
    mediaId: Schema.String,
  }),
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

export class JobError extends Schema.TaggedErrorClass<JobError>()(
  "JobError",
  domainErrorFields
) {}
