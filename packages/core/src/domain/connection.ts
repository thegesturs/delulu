import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { ConnectionId, WorkspaceId } from "../kernel/ids";
import {
  domainErrorFields,
  entityFields,
  JsonObject,
  repository,
} from "./shared";

export class Connection extends Model.Class<Connection>("Connection")({
  ...entityFields(ConnectionId),
  workspaceId: WorkspaceId,
  platform: Schema.String,
  profileId: Schema.String,
  username: Schema.NullOr(Schema.String),
  displayName: Schema.NullOr(Schema.String),
  accessToken: Schema.String,
  refreshToken: Schema.NullOr(Schema.String),
  cipherVersion: Schema.Literal("v1"),
  expiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  metadata: JsonObject,
}) {}
export class ConnectionModelError extends Schema.TaggedErrorClass<ConnectionModelError>()(
  "ConnectionModelError",
  domainErrorFields
) {}
export const makeConnectionRepository = Effect.fn("makeConnectionRepository")(
  () => repository(Connection, "id", "connections", "ConnectionRepository")
);
