import {
  AutomationNodePositions,
  AutomationNote,
  AutomationStep,
  AutomationTrigger,
} from "@delulu/core/domain/automation";
import { ConnectionId } from "@delulu/core/kernel/ids";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import {
  ConflictErrorResponse,
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  ValidationErrorResponse,
} from "./errors";
import { Authentication } from "./middleware";

const WorkspacePath = {
  workspaceId: Schema.String,
  platform: Schema.Literal("instagram"),
  category: Schema.String,
};
const ResourcePath = { ...WorkspacePath, id: Schema.String };
const PageQuery = {
  limit: Schema.optional(Schema.NumberFromString),
  offset: Schema.optional(Schema.NumberFromString),
};
const Page = <A extends Schema.Top>(item: A) =>
  Schema.Struct({
    data: Schema.Array(item),
    total: Schema.Number,
    limit: Schema.Number,
    offset: Schema.Number,
  });

export const AutomationTriggerInput = AutomationTrigger;
export const AutomationStepInput = AutomationStep;
export const AutomationNoteInput = AutomationNote;
const NodePositions = AutomationNodePositions;
export const AutomationWrite = Schema.Struct({
  connectionId: ConnectionId,
  name: Schema.String,
  description: Schema.optional(Schema.NullOr(Schema.String)),
  enabled: Schema.optional(Schema.Boolean),
  triggers: Schema.Array(AutomationTriggerInput),
  steps: Schema.Array(AutomationStepInput),
  notes: Schema.optional(Schema.Array(AutomationNoteInput)),
  nodePositions: Schema.optional(NodePositions),
});
export const AutomationPatch = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  enabled: Schema.optional(Schema.Boolean),
  triggers: Schema.optional(Schema.Array(AutomationTriggerInput)),
  steps: Schema.optional(Schema.Array(AutomationStepInput)),
  notes: Schema.optional(Schema.Array(AutomationNoteInput)),
  nodePositions: Schema.optional(NodePositions),
});
export const AutomationView = Schema.Struct({
  id: Schema.String,
  workspaceId: Schema.String,
  connectionId: Schema.String,
  platform: Schema.String,
  category: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  enabled: Schema.Boolean,
  triggers: Schema.Array(AutomationTriggerInput),
  steps: Schema.Array(AutomationStepInput),
  notes: Schema.Array(AutomationNoteInput),
  nodePositions: NodePositions,
  totalTriggered: Schema.Number,
  totalDmsSent: Schema.Number,
  totalFailed: Schema.Number,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export const AutomationRunView = Schema.Struct({
  id: Schema.String,
  automationId: Schema.String,
  status: Schema.String,
  input: Schema.Record(Schema.String, Schema.Unknown),
  output: Schema.Record(Schema.String, Schema.Unknown),
  error: Schema.NullOr(Schema.String),
  startedAt: Schema.String,
  completedAt: Schema.NullOr(Schema.String),
});
export const AutomationInboxItem = Schema.Struct({
  sessionId: Schema.String,
  automationId: Schema.String,
  platformUserId: Schema.String,
  platformUsername: Schema.NullOr(Schema.String),
  currentStepId: Schema.String,
  status: Schema.String,
  lastActivityAt: Schema.String,
});

const errors = [
  NotFoundErrorResponse,
  ForbiddenErrorResponse,
  ValidationErrorResponse,
  ConflictErrorResponse,
];

export const AutomationsGroup = HttpApiGroup.make("automations")
  .add(
    HttpApiEndpoint.get("list", "/", {
      params: WorkspacePath,
      query: PageQuery,
      success: Page(AutomationView),
      error: errors,
    }),
    HttpApiEndpoint.post("create", "/", {
      params: WorkspacePath,
      payload: AutomationWrite,
      success: AutomationView,
      error: errors,
    }),
    HttpApiEndpoint.get("get", "/:id", {
      params: ResourcePath,
      success: AutomationView,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: ResourcePath,
      payload: AutomationPatch,
      success: AutomationView,
      error: errors,
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: ResourcePath,
      success: Schema.Struct({ deleted: Schema.Boolean }),
      error: errors,
    }),
    HttpApiEndpoint.get("runs", "/runs", {
      params: WorkspacePath,
      query: { ...PageQuery, automationId: Schema.optional(Schema.String) },
      success: Page(AutomationRunView),
      error: errors,
    }),
    HttpApiEndpoint.get("inbox", "/inbox", {
      params: WorkspacePath,
      query: PageQuery,
      success: Page(AutomationInboxItem),
      error: errors,
    })
  )
  .middleware(Authentication)
  .prefix("/v1/workspaces/:workspaceId/automations/:platform/:category")
  .annotate(OpenApi.Title, "Automations");
