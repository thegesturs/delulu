import { Schema } from "effect";

const AutomationActor = {
  profileId: Schema.String,
  platformUserId: Schema.String,
  platformUsername: Schema.optional(Schema.NullOr(Schema.String)),
};

export const AutomationEvent = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("CommentReceived"),
    eventId: Schema.String,
    ...AutomationActor,
    triggerType: Schema.Literals(["comment", "mention", "story_reply"]),
    mediaId: Schema.String,
    text: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("MessageReceived"),
    eventId: Schema.String,
    ...AutomationActor,
    text: Schema.optional(Schema.String),
    quickReplyPayload: Schema.optional(Schema.String),
  }),
]);
export type AutomationEvent = typeof AutomationEvent.Type;
