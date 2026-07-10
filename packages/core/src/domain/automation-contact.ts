import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { AutomationContactId, AutomationId, WorkspaceId } from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonObject,
  repository,
} from "./shared";

export class AutomationContact extends Model.Class<AutomationContact>(
  "AutomationContact"
)({
  ...entityFields(AutomationContactId),
  workspaceId: WorkspaceId,
  automationId: AutomationId,
  platformUserId: Schema.String,
  email: Schema.NullOr(Schema.String),
  metadata: JsonObject,
}) {}
export class AutomationContactError extends Schema.TaggedErrorClass<AutomationContactError>()(
  "AutomationContactError",
  domainErrorFields
) {}
export const makeAutomationContactRepository = Effect.fn(
  "makeAutomationContactRepository"
)(() =>
  repository(
    AutomationContact,
    "id",
    "automation_contacts",
    "AutomationContactRepository"
  )
);
