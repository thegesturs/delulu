import { UnauthorizedError } from "@delulu/contracts";
import { parseScopes, type Scope, scopesToString } from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import { AuthConfig } from "./config";
import { exportPublicJwk, importEcPrivateKeyFromPkcs8 } from "./crypto";
import {
  audienceMatches,
  parseJwt,
  signEs256Jwt,
  timeClaimsValid,
  verifyEs256Jwt,
} from "./jwt";

/**
 * Token lifetimes for our AS. Short-lived access, long rotated refresh (#149).
 * The single place these live.
 */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface AccessTokenClaims {
  readonly sub: string;
  readonly scopes: readonly Scope[];
  readonly aud: string;
}

export interface IssuedAccessToken {
  readonly token: string;
  readonly expiresInSeconds: number;
}

/**
 * Signs and verifies our own AS access tokens (ES256 via WebCrypto). Claims are
 * exactly `sub`, `scope`, `aud` (RFC 8707) plus `iss`/`iat`/`exp` — workspace
 * and role are deliberately NOT in the token; they resolve live from Postgres.
 */
export class AsTokenService extends Context.Service<
  AsTokenService,
  {
    readonly issueAccessToken: (input: {
      readonly sub: string;
      readonly scopes: readonly Scope[];
      readonly resource: string;
    }) => Effect.Effect<IssuedAccessToken>;
    readonly verifyAccessToken: (
      token: string
    ) => Effect.Effect<AccessTokenClaims, UnauthorizedError>;
    readonly jwks: () => Effect.Effect<{
      readonly keys: readonly JsonWebKey[];
    }>;
  }
>()("@delulu/services/AsTokenService") {
  static readonly layer = Layer.effect(
    AsTokenService,
    Effect.gen(function* () {
      const config = yield* AuthConfig;
      if (!config.asSigningKeyPem) {
        return yield* Effect.die(
          "AsTokenService requires config.asSigningKeyPem"
        );
      }
      const kid = config.asSigningKid ?? "delulu-as-key";

      const privateKey = yield* Effect.tryPromise({
        try: () =>
          importEcPrivateKeyFromPkcs8(config.asSigningKeyPem as string),
        catch: (cause) => cause,
      }).pipe(Effect.orDie);

      const publicJwk = yield* Effect.promise(() =>
        exportPublicJwk(privateKey)
      );

      // Re-import the derived public key with verify usage.
      const verifyKey = yield* Effect.tryPromise({
        try: () =>
          crypto.subtle.importKey(
            "jwk",
            publicJwk,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["verify"]
          ),
        catch: (cause) => cause,
      }).pipe(Effect.orDie);

      const jwksDoc = {
        keys: [
          {
            ...publicJwk,
            kid,
            use: "sig",
            alg: "ES256",
          } as JsonWebKey,
        ],
      };

      const issueAccessToken = (input: {
        readonly sub: string;
        readonly scopes: readonly Scope[];
        readonly resource: string;
      }) =>
        Effect.gen(function* () {
          const now = Math.floor(Date.now() / 1000);
          const token = yield* Effect.promise(() =>
            signEs256Jwt(
              privateKey,
              { alg: "ES256", typ: "JWT", kid },
              {
                iss: config.asIssuer,
                sub: input.sub,
                aud: input.resource,
                scope: scopesToString(input.scopes),
                iat: now,
                exp: now + ACCESS_TOKEN_TTL_SECONDS,
              }
            )
          );
          return {
            token,
            expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
          } satisfies IssuedAccessToken;
        });

      const verifyAccessToken = (token: string) =>
        Effect.gen(function* () {
          const parsed = parseJwt(token);
          if (parsed === null || parsed.header.alg !== "ES256") {
            return yield* Effect.fail(
              new UnauthorizedError({ message: "Malformed access token" })
            );
          }
          const valid = yield* Effect.promise(() =>
            verifyEs256Jwt(parsed, verifyKey)
          );
          const now = Math.floor(Date.now() / 1000);
          if (!(valid && timeClaimsValid(parsed.claims, { now }))) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Invalid or expired access token",
              })
            );
          }
          if (parsed.claims.iss !== config.asIssuer) {
            return yield* Effect.fail(
              new UnauthorizedError({ message: "Untrusted token issuer" })
            );
          }
          if (!audienceMatches(parsed.claims, config.apiResource)) {
            return yield* Effect.fail(
              new UnauthorizedError({ message: "Token audience mismatch" })
            );
          }
          const sub = parsed.claims.sub;
          if (typeof sub !== "string" || sub.length === 0) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Access token is missing a subject",
              })
            );
          }
          return {
            sub,
            scopes: parseScopes(
              typeof parsed.claims.scope === "string"
                ? parsed.claims.scope
                : undefined
            ),
            aud: config.apiResource,
          } satisfies AccessTokenClaims;
        });

      const jwks = () => Effect.succeed(jwksDoc);

      return AsTokenService.of({
        issueAccessToken,
        verifyAccessToken,
        jwks,
      });
    })
  );
}
