import { Schema } from "effect";

const JsonObject = Schema.Record(Schema.String, Schema.Unknown);

export const MetaCommentValue = Schema.Struct({
  id: Schema.String,
  parent_id: Schema.optional(Schema.String),
  text: Schema.optional(Schema.String),
  from: Schema.optional(
    Schema.Struct({
      id: Schema.String,
      username: Schema.optional(Schema.String),
    })
  ),
  media: Schema.optional(Schema.Struct({ id: Schema.String })),
});
export const MetaMessage = Schema.Struct({
  mid: Schema.optional(Schema.String),
  text: Schema.optional(Schema.String),
  quick_reply: Schema.optional(Schema.Struct({ payload: Schema.String })),
  reply_to: Schema.optional(
    Schema.Struct({
      story: Schema.optional(Schema.Struct({ id: Schema.String })),
    })
  ),
});
export const MetaWebhookPayload = Schema.Struct({
  object: Schema.Literal("instagram"),
  entry: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      time: Schema.optional(Schema.Number),
      changes: Schema.optional(
        Schema.Array(
          Schema.Struct({
            field: Schema.String,
            value: MetaCommentValue,
          })
        )
      ),
      messaging: Schema.optional(
        Schema.Array(
          Schema.Struct({
            sender: Schema.Struct({ id: Schema.String }),
            recipient: Schema.Struct({ id: Schema.String }),
            timestamp: Schema.optional(Schema.Number),
            message: Schema.optional(MetaMessage),
            postback: Schema.optional(
              Schema.Struct({
                mid: Schema.optional(Schema.String),
                title: Schema.optional(Schema.String),
                payload: Schema.String,
              })
            ),
          })
        )
      ),
    })
  ),
});

export const DodoWebhookPayload = Schema.Struct({
  type: Schema.String,
  data: JsonObject,
  created_at: Schema.optional(Schema.String),
  timestamp: Schema.optional(Schema.Union([Schema.String, Schema.Number])),
});

export const WebhookAccepted = Schema.Struct({
  accepted: Schema.Boolean,
  duplicate: Schema.Boolean,
});
