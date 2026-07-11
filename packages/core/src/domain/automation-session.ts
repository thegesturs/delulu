import { Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { AutomationId, WorkspaceId } from "../kernel/ids";
import { entityFields, JsonObject } from "./shared";

export const AutomationSessionId = Schema.String.pipe(
  Schema.brand("AutomationSessionId")
);
export type AutomationSessionId = typeof AutomationSessionId.Type;

export const AutomationSessionStatus = Schema.Literals([
  "active",
  "completed",
  "expired",
]);

export class AutomationSession extends Model.Class<AutomationSession>(
  "AutomationSession"
)({
  ...entityFields(AutomationSessionId),
  workspaceId: WorkspaceId,
  automationId: AutomationId,
  platformUserId: Schema.String,
  platformUsername: Schema.NullOr(Schema.String),
  currentStepId: Schema.String,
  triggerEventId: Schema.NullOr(Schema.String),
  triggerMediaId: Schema.NullOr(Schema.String),
  status: AutomationSessionStatus,
  variables: JsonObject,
  lastActivityAt: Schema.DateTimeUtcFromDate,
}) {}

export const AutomationSessionCacheValue = Schema.Struct({
  sessionId: AutomationSessionId,
  automationId: AutomationId,
});
