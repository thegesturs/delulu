import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { ApiKeyId, MemberId, WorkspaceId } from "../kernel/ids";
import { Scope } from "./auth";
import { domainErrorFields, entityFields, repository } from "./shared";
import { WorkspaceRole } from "./workspace-member";

export class ApiKey extends Model.Class<ApiKey>("ApiKey")({
  ...entityFields(ApiKeyId),
  workspaceId: WorkspaceId,
  createdByMemberId: MemberId,
  name: Schema.String,
  keyPrefix: Schema.String,
  keyHash: Schema.String,
  // Assignable, frozen-at-mint role (≤ creator's role) and the scopes that
  // narrow below it (#149). `effective = rolePerms(role) ∩ scopes`.
  role: WorkspaceRole,
  scopes: Schema.Array(Scope),
  lastUsedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  expiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class ApiKeyError extends Schema.TaggedErrorClass<ApiKeyError>()(
  "ApiKeyError",
  domainErrorFields
) {}
export const makeApiKeyRepository = Effect.fn("makeApiKeyRepository")(() =>
  repository(ApiKey, "id", "api_keys", "ApiKeyRepository")
);
