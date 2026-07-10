import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import {
  OAuthAuthorizationCodeId,
  OAuthClientId,
  OAuthGrantId,
  OAuthRefreshTokenId,
  UserId,
} from "../kernel/ids";
import { Scope } from "./auth";
import { domainErrorFields, entityFields, repository } from "./shared";

/**
 * A registered OAuth client. First-party clients (`delulu-cli`, `delulu-mcp`)
 * are seeded by migration; third-party dynamic registration is deferred (#149).
 * `clientId` is the public protocol identifier; `id` is the internal entity id.
 */
export class OAuthClient extends Model.Class<OAuthClient>("OAuthClient")({
  ...entityFields(OAuthClientId),
  clientId: Schema.String,
  name: Schema.String,
  tokenEndpointAuthMethod: Schema.Literals(["none", "client_secret_basic"]),
  redirectUris: Schema.Array(Schema.String),
  firstParty: Schema.Boolean,
}) {}
export class OAuthClientError extends Schema.TaggedErrorClass<OAuthClientError>()(
  "OAuthClientError",
  domainErrorFields
) {}
export const makeOAuthClientRepository = Effect.fn("makeOAuthClientRepository")(
  () => repository(OAuthClient, "id", "oauth_clients", "OAuthClientRepository")
);

/**
 * A single-use authorization code issued by `/oauth/authorize/finalize` and
 * redeemed at `/oauth/token`. `codeHash` is the SHA-256 of the opaque code;
 * `resource` is the RFC 8707 audience the resulting tokens are bound to.
 */
export class OAuthAuthorizationCode extends Model.Class<OAuthAuthorizationCode>(
  "OAuthAuthorizationCode"
)({
  ...entityFields(OAuthAuthorizationCodeId),
  codeHash: Schema.String,
  clientId: Schema.String,
  userId: UserId,
  scopes: Schema.Array(Scope),
  codeChallenge: Schema.String,
  codeChallengeMethod: Schema.Literals(["S256"]),
  redirectUri: Schema.String,
  resource: Schema.NullOr(Schema.String),
  expiresAt: Schema.DateTimeUtcFromDate,
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class OAuthAuthorizationCodeError extends Schema.TaggedErrorClass<OAuthAuthorizationCodeError>()(
  "OAuthAuthorizationCodeError",
  domainErrorFields
) {}
export const makeOAuthAuthorizationCodeRepository = Effect.fn(
  "makeOAuthAuthorizationCodeRepository"
)(() =>
  repository(
    OAuthAuthorizationCode,
    "id",
    "oauth_authorization_codes",
    "OAuthAuthorizationCodeRepository"
  )
);

/** A user × client consent record — consent management + revocation only. */
export class OAuthGrant extends Model.Class<OAuthGrant>("OAuthGrant")({
  ...entityFields(OAuthGrantId),
  userId: UserId,
  clientId: Schema.String,
  scopes: Schema.Array(Scope),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class OAuthGrantError extends Schema.TaggedErrorClass<OAuthGrantError>()(
  "OAuthGrantError",
  domainErrorFields
) {}
export const makeOAuthGrantRepository = Effect.fn("makeOAuthGrantRepository")(
  () => repository(OAuthGrant, "id", "oauth_grants", "OAuthGrantRepository")
);

/**
 * A rotated, revocable refresh token. `familyId` links all tokens derived from
 * one original grant; `rotatedFrom` records the parent. Presenting an already
 * rotated (consumed) token is reuse → the whole family is revoked (#149).
 */
export class OAuthRefreshToken extends Model.Class<OAuthRefreshToken>(
  "OAuthRefreshToken"
)({
  ...entityFields(OAuthRefreshTokenId),
  tokenHash: Schema.String,
  grantId: OAuthGrantId,
  userId: UserId,
  clientId: Schema.String,
  scopes: Schema.Array(Scope),
  resource: Schema.NullOr(Schema.String),
  familyId: Schema.String,
  rotatedFrom: Schema.NullOr(Schema.String),
  expiresAt: Schema.DateTimeUtcFromDate,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}) {}
export class OAuthRefreshTokenError extends Schema.TaggedErrorClass<OAuthRefreshTokenError>()(
  "OAuthRefreshTokenError",
  domainErrorFields
) {}
export const makeOAuthRefreshTokenRepository = Effect.fn(
  "makeOAuthRefreshTokenRepository"
)(() =>
  repository(
    OAuthRefreshToken,
    "id",
    "oauth_refresh_tokens",
    "OAuthRefreshTokenRepository"
  )
);
