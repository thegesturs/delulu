import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { ApiKeyId, MemberId, WorkspaceId } from "../kernel/ids";
import { domainErrorFields, entityFields, repository } from "./shared";

export class ApiKey extends Model.Class<ApiKey>("ApiKey")({
  ...entityFields(ApiKeyId),
  workspaceId: WorkspaceId,
  createdByMemberId: MemberId,
  name: Schema.String,
  keyPrefix: Schema.String,
  keyHash: Schema.String,
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
