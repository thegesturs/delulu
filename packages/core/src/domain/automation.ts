import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { AutomationId, ConnectionId, PostId, WorkspaceId } from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonColumn,
  JsonObject,
  repository,
} from "./shared";

export const AutomationTriggerType = Schema.Literals([
  "comment",
  "mention",
  "story_reply",
]);
export type AutomationTriggerType = typeof AutomationTriggerType.Type;
export const AutomationTriggerTargetMode = Schema.Literals(["specific", "all"]);
export type AutomationTriggerTargetMode =
  typeof AutomationTriggerTargetMode.Type;

export const AutomationConditionOperator = Schema.Literals([
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

export const AutomationKeywordFilter = Schema.Struct({
  operator: AutomationConditionOperator,
  value: Schema.optional(Schema.String),
  caseSensitive: Schema.optional(Schema.Boolean),
});

export const AutomationCommentReply = Schema.Struct({
  enabled: Schema.Boolean,
  replies: Schema.Array(Schema.String),
});

export const AutomationTrigger = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("trigger"),
  triggerType: AutomationTriggerType,
  targetMode: Schema.optional(AutomationTriggerTargetMode),
  targetPostIds: Schema.Array(Schema.String),
  pendingPostIds: Schema.optional(Schema.Array(PostId)),
  keywordFilter: Schema.optional(AutomationKeywordFilter),
  commentReply: Schema.optional(AutomationCommentReply),
  nextStepId: Schema.optional(Schema.String),
});
export type AutomationTrigger = typeof AutomationTrigger.Type;

export const automationTriggerTargetMode = (
  trigger: Pick<
    AutomationTrigger,
    "targetMode" | "targetPostIds" | "pendingPostIds"
  >
): AutomationTriggerTargetMode =>
  trigger.targetMode ??
  (trigger.targetPostIds.length === 0 &&
  (trigger.pendingPostIds?.length ?? 0) === 0
    ? "all"
    : "specific");

export const automationTriggerValidationIssues = (
  triggers: readonly AutomationTrigger[]
): readonly { readonly path: string; readonly message: string }[] => {
  if (triggers.length === 0) {
    return [{ path: "triggers", message: "At least one trigger is required" }];
  }
  return triggers.flatMap((trigger, index) => {
    if (trigger.triggerType === "mention") {
      return [
        {
          path: `triggers.${index}.triggerType`,
          message: "Mention triggers are not available",
        },
      ];
    }
    const mode = automationTriggerTargetMode(trigger);
    const targetCount =
      trigger.targetPostIds.length + (trigger.pendingPostIds?.length ?? 0);
    if (mode === "specific" && targetCount === 0) {
      return [
        {
          path: `triggers.${index}`,
          message:
            "Specific-post triggers require at least one live or scheduled target",
        },
      ];
    }
    if (mode === "all" && targetCount > 0) {
      return [
        {
          path: `triggers.${index}`,
          message: "All-post triggers cannot carry target IDs",
        },
      ];
    }
    if (
      trigger.commentReply?.enabled &&
      trigger.commentReply.replies.every((reply) => reply.trim().length === 0)
    ) {
      return [
        {
          path: `triggers.${index}.commentReply.replies`,
          message: "Enabled comment replies require at least one message",
        },
      ];
    }
    return [];
  });
};

export const resolvePendingAutomationTriggers = (
  triggers: readonly AutomationTrigger[],
  postId: string,
  platformMediaId: string
): AutomationTrigger[] =>
  triggers.map((trigger) => {
    if (!trigger.pendingPostIds?.includes(postId as PostId)) {
      return trigger;
    }
    const pendingPostIds = trigger.pendingPostIds.filter((id) => id !== postId);
    return {
      ...trigger,
      targetMode: "specific",
      targetPostIds: [...new Set([...trigger.targetPostIds, platformMediaId])],
      pendingPostIds: pendingPostIds.length > 0 ? pendingPostIds : undefined,
    };
  });

export const AutomationButton = Schema.Union([
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

export const AutomationStep = Schema.Union([
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("condition"),
    operator: AutomationConditionOperator,
    value: Schema.optional(Schema.String),
    caseSensitive: Schema.optional(Schema.Boolean),
    yesStepId: Schema.optional(Schema.String),
    noStepId: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    id: Schema.String,
    type: Schema.Literal("send_dm"),
    messageTemplate: Schema.String,
    buttons: Schema.optional(Schema.Array(AutomationButton)),
    commentReply: Schema.optional(AutomationCommentReply),
    nextStepId: Schema.optional(Schema.String),
  }),
]);
export type AutomationStep = typeof AutomationStep.Type;

export const AutomationNote = Schema.Struct({
  id: Schema.String,
  content: Schema.String,
  position: Schema.Struct({ x: Schema.Number, y: Schema.Number }),
});
export type AutomationNote = typeof AutomationNote.Type;
export const AutomationNodePositions = Schema.Record(
  Schema.String,
  Schema.Struct({ x: Schema.Number, y: Schema.Number })
);
export type AutomationNodePositions = typeof AutomationNodePositions.Type;

export class Automation extends Model.Class<Automation>("Automation")({
  ...entityFields(AutomationId),
  externalSubmissionId: Schema.NullOr(Schema.String),
  workspaceId: WorkspaceId,
  connectionId: ConnectionId,
  platform: Schema.String,
  category: Schema.String,
  /** Legacy migration payload retained through the cutover soak. */
  triggerConfig: JsonObject,
  name: Schema.String.pipe(
    Schema.withConstructorDefault(Effect.succeed("Untitled automation"))
  ),
  description: Schema.NullOr(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(null))
  ),
  triggers: JsonColumn(Schema.Array(AutomationTrigger)).pipe(
    Schema.withConstructorDefault(Effect.succeed([]))
  ),
  steps: JsonColumn(Schema.Array(AutomationStep)).pipe(
    Schema.withConstructorDefault(Effect.succeed([]))
  ),
  notes: JsonColumn(Schema.Array(AutomationNote)).pipe(
    Schema.withConstructorDefault(Effect.succeed([]))
  ),
  nodePositions: JsonColumn(AutomationNodePositions).pipe(
    Schema.withConstructorDefault(Effect.succeed({}))
  ),
  totalTriggered: Schema.Number.pipe(
    Schema.withConstructorDefault(Effect.succeed(0))
  ),
  totalDmsSent: Schema.Number.pipe(
    Schema.withConstructorDefault(Effect.succeed(0))
  ),
  totalFailed: Schema.Number.pipe(
    Schema.withConstructorDefault(Effect.succeed(0))
  ),
  enabled: Schema.Boolean,
}) {}
export class AutomationError extends Schema.TaggedErrorClass<AutomationError>()(
  "AutomationError",
  domainErrorFields
) {}
export class AutomationPersistenceError extends Schema.TaggedErrorClass<AutomationPersistenceError>()(
  "AutomationPersistenceError",
  {
    operation: Schema.String,
    message: Schema.String,
    cause: Schema.Defect(),
  }
) {}
export const makeAutomationRepository = Effect.fn("makeAutomationRepository")(
  () => repository(Automation, "id", "automations", "AutomationRepository")
);
