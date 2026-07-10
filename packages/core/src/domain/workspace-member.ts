import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { MemberId, UserId, WorkspaceId } from "../kernel/ids";
import { domainErrorFields, entityFields, repository } from "./shared";

export const WorkspaceRole = Schema.Literals([
  "owner",
  "admin",
  "editor",
  "viewer",
]);
export type WorkspaceRole = typeof WorkspaceRole.Type;
export class WorkspaceMember extends Model.Class<WorkspaceMember>(
  "WorkspaceMember"
)({
  ...entityFields(MemberId),
  workspaceId: WorkspaceId,
  userId: UserId,
  role: WorkspaceRole,
}) {}
export class WorkspaceMemberError extends Schema.TaggedErrorClass<WorkspaceMemberError>()(
  "WorkspaceMemberError",
  domainErrorFields
) {}
export const makeWorkspaceMemberRepository = Effect.fn(
  "makeWorkspaceMemberRepository"
)(() =>
  repository(
    WorkspaceMember,
    "id",
    "workspace_members",
    "WorkspaceMemberRepository"
  )
);
