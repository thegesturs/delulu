import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyTriggerType = Schema.Literals([
  "COMMENT",
  "MENTION",
  "STORY_REPLY",
]);
export type LegacyTriggerType = typeof LegacyTriggerType.Type;

export const LegacyConditionOperator = Schema.Literals([
  "contains",
  "not_contains",
  "equals",
  "starts_with",
  "ends_with",
  "regex",
  "always",
  "is_follower",
  "has_email",
]);

const LegacyKeywordFilter = Schema.Struct({
  operator: LegacyConditionOperator,
  value: Schema.optional(Schema.String),
  caseSensitive: Schema.optional(Schema.Boolean),
});

const LegacyCommentReply = Schema.Struct({
  enabled: Schema.Boolean,
  replies: Schema.Array(Schema.String),
});

const LegacyDmButton = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("quick_reply"),
    title: Schema.String,
    payload: Schema.String,
    nextStepId: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal("url"),
    title: Schema.String,
    url: Schema.String,
  }),
]);

export const LegacyTriggerStep = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("trigger"),
  triggerType: LegacyTriggerType,
  targetPostIds: Schema.Array(Schema.String),
  pendingPostIds: Schema.optional(Schema.Array(Schema.String)),
  keywordFilter: Schema.optional(LegacyKeywordFilter),
  commentReply: Schema.optional(LegacyCommentReply),
  nextStepId: Schema.optional(Schema.String),
});
export type LegacyTriggerStep = typeof LegacyTriggerStep.Type;

export const LegacyAutomationStep = Schema.Union([
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("condition"),
    operator: LegacyConditionOperator,
    value: Schema.optional(Schema.String),
    caseSensitive: Schema.optional(Schema.Boolean),
    yesStepId: Schema.optional(Schema.String),
    noStepId: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("send_dm"),
    messageTemplate: Schema.String,
    buttons: Schema.optional(Schema.Array(LegacyDmButton)),
    commentReply: Schema.optional(LegacyCommentReply),
    nextStepId: Schema.optional(Schema.String),
  }),
]);

const LegacyNote = Schema.Struct({
  id: Schema.String,
  content: Schema.String,
  position: Schema.Struct({ x: Schema.Number, y: Schema.Number }),
});

export const LegacyAutomation = Schema.Struct({
  ...SystemFields,
  userId: Schema.optional(Schema.String),
  organizationId: Schema.optional(Schema.String),
  socialProviderId: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  isActive: Schema.Boolean,
  triggers: Schema.Array(LegacyTriggerStep),
  steps: Schema.Array(LegacyAutomationStep),
  notes: Schema.optional(Schema.Array(LegacyNote)),
  nodePositions: Schema.optional(Schema.Unknown),
  totalTriggered: Schema.Number,
  totalDMsSent: Schema.Number,
  totalFailed: Schema.Number,
  createdAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyAutomation = typeof LegacyAutomation.Type;

export const LegacyAutomationLog = Schema.Struct({
  ...SystemFields,
  automationId: Schema.String,
  userId: Schema.String,
  instagramCommentId: Schema.String,
  instagramUsername: Schema.optional(Schema.String),
  status: Schema.Literal("DM_SENT"),
  createdAt: Schema.optional(Schema.Number),
});
export type LegacyAutomationLog = typeof LegacyAutomationLog.Type;

export const LegacyAutomationContact = Schema.Struct({
  ...SystemFields,
  userId: Schema.String,
  socialProviderId: Schema.String,
  instagramUserId: Schema.String,
  instagramUsername: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  collectedData: Schema.optional(Schema.Unknown),
  createdAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyAutomationContact = typeof LegacyAutomationContact.Type;
