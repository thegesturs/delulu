import {
  makeId,
  makeOAuthAuthorizationCodeRepository,
  makeOAuthGrantRepository,
  makeOAuthRefreshTokenRepository,
  OAuthAuthorizationCode,
  OAuthAuthorizationCodeId,
  OAuthClient,
  OAuthGrant,
  OAuthGrantId,
  OAuthRefreshToken,
  OAuthRefreshTokenId,
  Scope,
} from "@delulu/core";
import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { AsTokenService, REFRESH_TOKEN_TTL_SECONDS } from "./as-token";
import { randomTokenBase64Url, sha256Hex } from "./crypto";
import { verifyPkceS256 } from "./pkce";

const AUTHORIZATION_CODE_TTL_SECONDS = 60;
const DEVICE_CODE_TTL_SECONDS = 600;
const DEVICE_POLL_INTERVAL_SECONDS = 5;
const DEVICE_GRANT_TYPE =
  "urn:ietf:params:oauth:grant-type:device_code" as const;
const DEVICE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * OAuth 2.1 error (RFC 6749 §5.2). Carries the standard `error` code and the
 * HTTP status the token/authorize route should emit.
 */
export class OAuthError extends Schema.TaggedErrorClass<OAuthError>()(
  "OAuthError",
  {
    error: Schema.String,
    description: Schema.String,
    status: Schema.Number,
  }
) {}

const invalidRequest = (description: string) =>
  new OAuthError({ error: "invalid_request", description, status: 400 });
const invalidGrant = (description: string) =>
  new OAuthError({ error: "invalid_grant", description, status: 400 });
const invalidClient = (description: string) =>
  new OAuthError({ error: "invalid_client", description, status: 401 });
const deviceError = (error: string, description: string) =>
  new OAuthError({ error, description, status: 400 });

export { DEVICE_GRANT_TYPE };

export interface OAuthTokenResponse {
  readonly access_token: string;
  readonly token_type: "Bearer";
  readonly expires_in: number;
  readonly refresh_token: string;
  readonly scope: string;
}

export interface IssueCodeInput {
  readonly clientId: string;
  readonly userId: string;
  readonly redirectUri: string;
  readonly scopes: readonly Scope[];
  readonly codeChallenge: string;
  readonly codeChallengeMethod: string;
  readonly resource: string | null;
  /** Workspace the resulting token is bound to; null ⇒ unrestricted. */
  readonly workspaceId: string | null;
}

export interface ExchangeCodeInput {
  readonly code: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly codeVerifier: string;
}

export interface RefreshInput {
  readonly refreshToken: string;
  readonly clientId: string;
}

export interface StartDeviceAuthorizationInput {
  readonly clientId: string;
  readonly scopes: readonly Scope[];
  readonly resource: string | null;
  readonly verificationUri: string;
}

export interface ExchangeDeviceCodeInput {
  readonly deviceCode: string;
  readonly clientId: string;
}

export interface DeviceAuthorizationResponse {
  readonly device_code: string;
  readonly user_code: string;
  readonly verification_uri: string;
  readonly verification_uri_complete: string;
  readonly expires_in: number;
  readonly interval: number;
}

interface DeviceAuthorizationRow {
  readonly id: string;
  readonly clientId: string;
  readonly userId: string | null;
  readonly scopes: readonly Scope[];
  readonly resource: string | null;
  readonly status: "pending" | "approved" | "denied" | "consumed";
  readonly intervalSeconds: number;
  readonly lastPolledAt: DateTime.Utc | null;
  readonly expiresAt: DateTime.Utc;
}

const deviceUserCode = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const value = Array.from(
    bytes,
    (byte) => DEVICE_ALPHABET[byte % DEVICE_ALPHABET.length]
  ).join("");
  return `${value.slice(0, 4)}-${value.slice(4)}`;
};

const normalizeUserCode = (value: string): string =>
  value.trim().toUpperCase().replaceAll("-", "");

/** Loopback redirect URIs match port-agnostically (RFC 8252 §7.3). */
const redirectUriMatches = (
  registered: readonly string[],
  provided: string
): boolean => {
  if (registered.includes(provided)) {
    return true;
  }
  let providedUrl: URL;
  try {
    providedUrl = new URL(provided);
  } catch {
    return false;
  }
  const isLoopback =
    providedUrl.hostname === "127.0.0.1" ||
    providedUrl.hostname === "localhost";
  if (!isLoopback) {
    return false;
  }
  return registered.some((entry) => {
    try {
      const registeredUrl = new URL(entry);
      return (
        (registeredUrl.hostname === "127.0.0.1" ||
          registeredUrl.hostname === "localhost") &&
        registeredUrl.pathname === providedUrl.pathname
      );
    } catch {
      return false;
    }
  });
};

/**
 * The OAuth 2.1 Authorization Server flow (#149): authorization-code issuance
 * (PKCE S256 + registered redirect + RFC 8707 resource), single-use code
 * exchange, and rotated refresh tokens with family reuse-detection. First-party
 * clients skip the consent screen; third-party consent UI is deferred.
 */
export class OAuthFlowService extends Context.Service<
  OAuthFlowService,
  {
    readonly issueCode: (
      input: IssueCodeInput
    ) => Effect.Effect<{ readonly code: string }, OAuthError>;
    readonly exchangeCode: (
      input: ExchangeCodeInput
    ) => Effect.Effect<OAuthTokenResponse, OAuthError>;
    readonly refresh: (
      input: RefreshInput
    ) => Effect.Effect<OAuthTokenResponse, OAuthError>;
    readonly startDeviceAuthorization: (
      input: StartDeviceAuthorizationInput
    ) => Effect.Effect<DeviceAuthorizationResponse, OAuthError>;
    readonly approveDeviceAuthorization: (input: {
      readonly userCode: string;
      readonly userId: string;
    }) => Effect.Effect<void, OAuthError>;
    readonly inspectDeviceAuthorization: (userCode: string) => Effect.Effect<
      {
        readonly clientId: string;
        readonly clientName: string;
        readonly scopes: readonly string[];
        readonly resource: string | null;
        readonly expiresAt: string;
      },
      OAuthError
    >;
    readonly denyDeviceAuthorization: (
      userCode: string
    ) => Effect.Effect<void, OAuthError>;
    readonly exchangeDeviceCode: (
      input: ExchangeDeviceCodeInput
    ) => Effect.Effect<OAuthTokenResponse, OAuthError>;
    readonly revoke: (token: string) => Effect.Effect<void>;
  }
>()("@delulu/services/OAuthFlowService") {
  static readonly layer = Layer.effect(
    OAuthFlowService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const tokens = yield* AsTokenService;
      const codeRepo = yield* makeOAuthAuthorizationCodeRepository();
      const grantRepo = yield* makeOAuthGrantRepository();
      const refreshRepo = yield* makeOAuthRefreshTokenRepository();

      const findClient = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: OAuthClient,
        execute: (clientId) =>
          sql`SELECT * FROM oauth_clients WHERE client_id = ${clientId}`,
      });

      const findCode = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: OAuthAuthorizationCode,
        execute: (codeHash) =>
          sql`SELECT * FROM oauth_authorization_codes WHERE code_hash = ${codeHash}`,
      });

      const findGrant = SqlSchema.findOneOption({
        Request: Schema.Struct({
          userId: Schema.String,
          clientId: Schema.String,
        }),
        Result: OAuthGrant,
        execute: ({ userId, clientId }) =>
          sql`SELECT * FROM oauth_grants WHERE user_id = ${userId} AND client_id = ${clientId}`,
      });

      const findRefresh = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: OAuthRefreshToken,
        execute: (tokenHash) =>
          sql`SELECT * FROM oauth_refresh_tokens WHERE token_hash = ${tokenHash}`,
      });

      const findDeviceByHash = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: Schema.Struct({
          id: Schema.String,
          clientId: Schema.String,
          userId: Schema.NullOr(Schema.String),
          scopes: Schema.Array(Scope),
          resource: Schema.NullOr(Schema.String),
          status: Schema.Literals([
            "pending",
            "approved",
            "denied",
            "consumed",
          ]),
          intervalSeconds: Schema.Number,
          lastPolledAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
          expiresAt: Schema.DateTimeUtcFromDate,
        }),
        execute: (deviceCodeHash) =>
          sql`SELECT id, client_id, user_id, scopes, resource, status,
            interval_seconds, last_polled_at, expires_at
            FROM oauth_device_authorizations
            WHERE device_code_hash = ${deviceCodeHash}`,
      });

      const ensureGrant = (
        userId: string,
        clientId: string,
        scopes: readonly Scope[]
      ): Effect.Effect<OAuthGrantId> =>
        findGrant({ userId, clientId }).pipe(
          Effect.flatMap(
            Option.match({
              onSome: (grant) => Effect.succeed(grant.id),
              onNone: () =>
                grantRepo
                  .insert(
                    OAuthGrant.insert.make({
                      id: makeId(OAuthGrantId),
                      legacyConvexId: null,
                      userId: userId as OAuthGrant["userId"],
                      clientId,
                      scopes,
                      revokedAt: null,
                    })
                  )
                  .pipe(Effect.map((grant) => grant.id)),
            })
          ),
          Effect.orDie
        );

      const mintRefreshToken = (input: {
        readonly grantId: OAuthGrantId;
        readonly userId: string;
        readonly clientId: string;
        readonly scopes: readonly Scope[];
        readonly resource: string | null;
        readonly workspaceId: string | null;
        readonly familyId: string;
        readonly rotatedFrom: string | null;
      }): Effect.Effect<string> =>
        Effect.gen(function* () {
          const token = randomTokenBase64Url(32);
          const tokenHash = yield* Effect.promise(() => sha256Hex(token));
          const expiresAt = DateTime.fromDateUnsafe(
            new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
          );
          yield* refreshRepo
            .insert(
              OAuthRefreshToken.insert.make({
                id: makeId(OAuthRefreshTokenId),
                legacyConvexId: null,
                tokenHash,
                grantId: input.grantId,
                userId: input.userId as OAuthRefreshToken["userId"],
                clientId: input.clientId,
                scopes: input.scopes,
                resource: input.resource,
                workspaceId:
                  input.workspaceId as OAuthRefreshToken["workspaceId"],
                familyId: input.familyId,
                rotatedFrom: input.rotatedFrom,
                expiresAt,
                revokedAt: null,
              })
            )
            .pipe(Effect.orDie);
          return token;
        });

      const issueTokenResponse = (input: {
        readonly userId: string;
        readonly scopes: readonly Scope[];
        readonly resource: string;
        readonly workspaceId: string | null;
        readonly refreshToken: string;
      }): Effect.Effect<OAuthTokenResponse> =>
        tokens
          .issueAccessToken({
            sub: input.userId,
            scopes: input.scopes,
            resource: input.resource,
            workspaceId: input.workspaceId,
          })
          .pipe(
            Effect.map((access) => ({
              access_token: access.token,
              token_type: "Bearer" as const,
              expires_in: access.expiresInSeconds,
              refresh_token: input.refreshToken,
              scope: input.scopes.join(" "),
            }))
          );

      const issueCode = (input: IssueCodeInput) =>
        Effect.gen(function* () {
          if (input.codeChallengeMethod !== "S256") {
            return yield* Effect.fail(
              invalidRequest("Only PKCE S256 is supported")
            );
          }
          const client = yield* findClient(input.clientId).pipe(Effect.orDie);
          if (Option.isNone(client)) {
            return yield* Effect.fail(invalidClient("Unknown client"));
          }
          if (
            !redirectUriMatches(client.value.redirectUris, input.redirectUri)
          ) {
            return yield* Effect.fail(
              invalidRequest("redirect_uri is not registered")
            );
          }
          yield* ensureGrant(input.userId, input.clientId, input.scopes);

          const code = randomTokenBase64Url(32);
          const codeHash = yield* Effect.promise(() => sha256Hex(code));
          const expiresAt = DateTime.fromDateUnsafe(
            new Date(Date.now() + AUTHORIZATION_CODE_TTL_SECONDS * 1000)
          );
          yield* codeRepo
            .insert(
              OAuthAuthorizationCode.insert.make({
                id: makeId(OAuthAuthorizationCodeId),
                legacyConvexId: null,
                codeHash,
                clientId: input.clientId,
                userId: input.userId as OAuthAuthorizationCode["userId"],
                scopes: input.scopes,
                codeChallenge: input.codeChallenge,
                codeChallengeMethod: "S256",
                redirectUri: input.redirectUri,
                resource: input.resource,
                workspaceId:
                  input.workspaceId as OAuthAuthorizationCode["workspaceId"],
                expiresAt,
                consumedAt: null,
              })
            )
            .pipe(Effect.orDie);
          return { code };
        });

      const exchangeCode = (input: ExchangeCodeInput) =>
        Effect.gen(function* () {
          const codeHash = yield* Effect.promise(() => sha256Hex(input.code));
          const maybeCode = yield* findCode(codeHash).pipe(Effect.orDie);
          if (Option.isNone(maybeCode)) {
            return yield* Effect.fail(
              invalidGrant("Unknown authorization code")
            );
          }
          const code = maybeCode.value;
          const now = yield* DateTime.now;
          if (
            code.consumedAt !== null ||
            DateTime.isLessThan(code.expiresAt, now) ||
            code.clientId !== input.clientId ||
            code.redirectUri !== input.redirectUri
          ) {
            return yield* Effect.fail(
              invalidGrant("Authorization code is invalid or expired")
            );
          }
          const pkceOk = yield* Effect.promise(() =>
            verifyPkceS256(input.codeVerifier, code.codeChallenge)
          );
          if (!pkceOk) {
            return yield* Effect.fail(invalidGrant("PKCE verification failed"));
          }
          // Single-use: consume the code before issuing tokens.
          yield* sql`UPDATE oauth_authorization_codes SET consumed_at = now() WHERE id = ${code.id}`.pipe(
            Effect.orDie
          );

          const resource = code.resource ?? "";
          const grantId = yield* ensureGrant(
            code.userId,
            code.clientId,
            code.scopes
          );
          const familyId = randomTokenBase64Url(16);
          const refreshToken = yield* mintRefreshToken({
            grantId,
            userId: code.userId,
            clientId: code.clientId,
            scopes: code.scopes,
            resource: code.resource,
            workspaceId: code.workspaceId,
            familyId,
            rotatedFrom: null,
          });
          return yield* issueTokenResponse({
            userId: code.userId,
            scopes: code.scopes,
            resource,
            workspaceId: code.workspaceId,
            refreshToken,
          });
        });

      const refresh = (input: RefreshInput) =>
        Effect.gen(function* () {
          const tokenHash = yield* Effect.promise(() =>
            sha256Hex(input.refreshToken)
          );
          const maybeToken = yield* findRefresh(tokenHash).pipe(Effect.orDie);
          if (Option.isNone(maybeToken)) {
            return yield* Effect.fail(invalidGrant("Unknown refresh token"));
          }
          const token = maybeToken.value;
          if (token.clientId !== input.clientId) {
            return yield* Effect.fail(invalidGrant("Client mismatch"));
          }
          // Reuse detection: a rotated (revoked) token being presented again
          // means the family is compromised — revoke every token in it.
          if (token.revokedAt !== null) {
            yield* sql`UPDATE oauth_refresh_tokens SET revoked_at = now() WHERE family_id = ${token.familyId} AND revoked_at IS NULL`.pipe(
              Effect.orDie
            );
            return yield* Effect.fail(
              invalidGrant("Refresh token reuse detected")
            );
          }
          const now = yield* DateTime.now;
          if (DateTime.isLessThan(token.expiresAt, now)) {
            return yield* Effect.fail(invalidGrant("Refresh token expired"));
          }
          // Rotate: consume the presented token, mint its successor.
          yield* sql`UPDATE oauth_refresh_tokens SET revoked_at = now() WHERE id = ${token.id}`.pipe(
            Effect.orDie
          );
          const newRefresh = yield* mintRefreshToken({
            grantId: token.grantId,
            userId: token.userId,
            clientId: token.clientId,
            scopes: token.scopes,
            resource: token.resource,
            workspaceId: token.workspaceId,
            familyId: token.familyId,
            rotatedFrom: token.id,
          });
          return yield* issueTokenResponse({
            userId: token.userId,
            scopes: token.scopes,
            resource: token.resource ?? "",
            workspaceId: token.workspaceId,
            refreshToken: newRefresh,
          });
        });

      const startDeviceAuthorization = Effect.fn(
        "OAuthFlowService.startDeviceAuthorization"
      )(function* (input: StartDeviceAuthorizationInput) {
        const client = yield* findClient(input.clientId).pipe(Effect.orDie);
        if (Option.isNone(client)) {
          return yield* invalidClient("Unknown client");
        }
        const deviceCode = randomTokenBase64Url(32);
        const userCode = deviceUserCode();
        const [deviceCodeHash, userCodeHash] = yield* Effect.all([
          Effect.promise(() => sha256Hex(deviceCode)),
          Effect.promise(() => sha256Hex(normalizeUserCode(userCode))),
        ]);
        const id = `oauth_device_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
        const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_SECONDS * 1000);
        yield* sql`INSERT INTO oauth_device_authorizations
          (id, device_code_hash, user_code_hash, client_id, scopes, resource,
           interval_seconds, expires_at)
          VALUES (${id}, ${deviceCodeHash}, ${userCodeHash}, ${input.clientId},
            ${input.scopes}, ${input.resource}, ${DEVICE_POLL_INTERVAL_SECONDS},
            ${expiresAt})`.pipe(Effect.orDie);
        const complete = new URL(input.verificationUri);
        complete.searchParams.set("user_code", userCode);
        return {
          device_code: deviceCode,
          user_code: userCode,
          verification_uri: input.verificationUri,
          verification_uri_complete: complete.toString(),
          expires_in: DEVICE_CODE_TTL_SECONDS,
          interval: DEVICE_POLL_INTERVAL_SECONDS,
        };
      });

      const inspectDeviceAuthorization = Effect.fn(
        "OAuthFlowService.inspectDeviceAuthorization"
      )(function* (userCode: string) {
        const codeHash = yield* Effect.promise(() =>
          sha256Hex(normalizeUserCode(userCode))
        );
        const rows = yield* sql<{
          clientId: string;
          clientName: string;
          scopes: string[];
          resource: string | null;
          expiresAt: Date;
        }>`SELECT d.client_id, c.name AS client_name, d.scopes, d.resource,
            d.expires_at FROM oauth_device_authorizations d
          JOIN oauth_clients c ON c.client_id = d.client_id
          WHERE d.user_code_hash = ${codeHash} AND d.status = 'pending'
            AND d.expires_at > now()`.pipe(Effect.orDie);
        if (!rows[0]) {
          return yield* invalidGrant("Device code is invalid or expired");
        }
        return {
          ...rows[0],
          expiresAt: rows[0].expiresAt.toISOString(),
        };
      });

      const approveDeviceAuthorization = Effect.fn(
        "OAuthFlowService.approveDeviceAuthorization"
      )(function* (input: { userCode: string; userId: string }) {
        const codeHash = yield* Effect.promise(() =>
          sha256Hex(normalizeUserCode(input.userCode))
        );
        const rows = yield* sql<{
          id: string;
        }>`UPDATE oauth_device_authorizations
          SET status = 'approved', user_id = ${input.userId}
          WHERE user_code_hash = ${codeHash} AND status = 'pending'
            AND expires_at > now()
          RETURNING id`.pipe(Effect.orDie);
        if (rows.length === 0) {
          return yield* invalidGrant("Device code is invalid or expired");
        }
      });

      const denyDeviceAuthorization = Effect.fn(
        "OAuthFlowService.denyDeviceAuthorization"
      )(function* (userCode: string) {
        const codeHash = yield* Effect.promise(() =>
          sha256Hex(normalizeUserCode(userCode))
        );
        const rows = yield* sql<{
          id: string;
        }>`UPDATE oauth_device_authorizations
          SET status = 'denied'
          WHERE user_code_hash = ${codeHash} AND status = 'pending'
            AND expires_at > now()
          RETURNING id`.pipe(Effect.orDie);
        if (rows.length === 0) {
          return yield* invalidGrant("Device code is invalid or expired");
        }
      });

      const exchangeDeviceCode = Effect.fn(
        "OAuthFlowService.exchangeDeviceCode"
      )(function* (input: ExchangeDeviceCodeInput) {
        const deviceCodeHash = yield* Effect.promise(() =>
          sha256Hex(input.deviceCode)
        );
        const maybeDevice = yield* findDeviceByHash(deviceCodeHash).pipe(
          Effect.orDie
        );
        if (Option.isNone(maybeDevice)) {
          return yield* deviceError("expired_token", "Device code is unknown");
        }
        const device = maybeDevice.value as DeviceAuthorizationRow;
        if (
          device.clientId !== input.clientId ||
          DateTime.toEpochMillis(device.expiresAt) <= Date.now() ||
          device.status === "consumed"
        ) {
          return yield* deviceError(
            "expired_token",
            "Device code is invalid or expired"
          );
        }
        if (device.status === "denied") {
          return yield* deviceError(
            "access_denied",
            "The user denied this authorization request"
          );
        }
        if (device.status === "pending") {
          if (
            device.lastPolledAt &&
            Date.now() - DateTime.toEpochMillis(device.lastPolledAt) <
              device.intervalSeconds * 1000
          ) {
            yield* sql`UPDATE oauth_device_authorizations
              SET last_polled_at = now(), interval_seconds = interval_seconds + 5
              WHERE id = ${device.id}`.pipe(Effect.orDie);
            return yield* deviceError(
              "slow_down",
              "Polling faster than the advertised interval"
            );
          }
          yield* sql`UPDATE oauth_device_authorizations SET last_polled_at = now()
            WHERE id = ${device.id}`.pipe(Effect.orDie);
          return yield* deviceError(
            "authorization_pending",
            "The user has not completed authorization"
          );
        }
        if (!device.userId) {
          return yield* invalidGrant("Approved device has no user");
        }
        const approvedUserId = device.userId;
        const refreshToken = yield* sql
          .withTransaction(
            Effect.gen(function* () {
              const consumed = yield* sql<{ id: string }>`
                UPDATE oauth_device_authorizations
                SET status = 'consumed', consumed_at = now()
                WHERE id = ${device.id} AND status = 'approved'
                RETURNING id`;
              if (consumed.length === 0) {
                return yield* deviceError(
                  "expired_token",
                  "Device code was consumed"
                );
              }
              const grantId = yield* ensureGrant(
                approvedUserId,
                device.clientId,
                device.scopes
              );
              return yield* mintRefreshToken({
                grantId,
                userId: approvedUserId,
                clientId: device.clientId,
                scopes: device.scopes,
                resource: device.resource,
                workspaceId: null,
                familyId: randomTokenBase64Url(16),
                rotatedFrom: null,
              });
            })
          )
          .pipe(Effect.catchTag("SqlError", Effect.die));
        return yield* issueTokenResponse({
          userId: approvedUserId,
          scopes: device.scopes,
          resource: device.resource ?? "",
          workspaceId: null,
          refreshToken,
        });
      });

      const revoke = (token: string) =>
        Effect.gen(function* () {
          const tokenHash = yield* Effect.promise(() => sha256Hex(token));
          yield* sql`UPDATE oauth_refresh_tokens SET revoked_at = now() WHERE token_hash = ${tokenHash} AND revoked_at IS NULL`;
        }).pipe(Effect.ignore);

      return OAuthFlowService.of({
        issueCode,
        exchangeCode,
        refresh,
        startDeviceAuthorization,
        approveDeviceAuthorization,
        inspectDeviceAuthorization,
        denyDeviceAuthorization,
        exchangeDeviceCode,
        revoke,
      });
    })
  );
}
