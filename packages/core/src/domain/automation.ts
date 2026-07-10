import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { AutomationId, ConnectionId, WorkspaceId } from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonObject,
  repository,
} from "./shared";

export class Automation extends Model.Class<Automation>("Automation")({
  ...entityFields(AutomationId),
  workspaceId: WorkspaceId,
  connectionId: ConnectionId,
  platform: Schema.String,
  category: Schema.String,
  triggerConfig: JsonObject,
  enabled: Schema.Boolean,
}) {}
export class AutomationError extends Schema.TaggedErrorClass<AutomationError>()(
  "AutomationError",
  domainErrorFields
) {}
export const makeAutomationRepository = Effect.fn("makeAutomationRepository")(
  () => repository(Automation, "id", "automations", "AutomationRepository")
);
