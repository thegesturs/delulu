import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { UserId, WorkspaceId } from "../kernel/ids";
import { domainErrorFields, entityFields, repository } from "./shared";

export class Workspace extends Model.Class<Workspace>("Workspace")({
  ...entityFields(WorkspaceId),
  name: Schema.String,
  slug: Schema.NullOr(Schema.String),
  billingOwnerUserId: UserId,
  parentOrgId: Schema.NullOr(WorkspaceId),
  clerkOrgId: Schema.NullOr(Schema.String),
  isPersonal: Schema.Boolean,
  deletedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class WorkspaceError extends Schema.TaggedErrorClass<WorkspaceError>()(
  "WorkspaceError",
  domainErrorFields
) {}
export const makeWorkspaceRepository = Effect.fn("makeWorkspaceRepository")(
  () => repository(Workspace, "id", "workspaces", "WorkspaceRepository")
);
