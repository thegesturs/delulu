import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { AutomationId, AutomationRunId, WorkspaceId } from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonObject,
  repository,
} from "./shared";

export class AutomationRun extends Model.Class<AutomationRun>("AutomationRun")({
  ...entityFields(AutomationRunId),
  workspaceId: WorkspaceId,
  automationId: AutomationId,
  status: Schema.String,
  input: JsonObject,
  output: JsonObject,
  error: Schema.NullOr(Schema.String),
  startedAt: Schema.DateTimeUtcFromDate,
  completedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class AutomationRunError extends Schema.TaggedErrorClass<AutomationRunError>()(
  "AutomationRunError",
  domainErrorFields
) {}
export const makeAutomationRunRepository = Effect.fn(
  "makeAutomationRunRepository"
)(() =>
  repository(AutomationRun, "id", "automation_runs", "AutomationRunRepository")
);
