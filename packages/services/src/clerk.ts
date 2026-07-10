import { UnauthorizedError } from "@delulu/contracts";
import { Context, Effect, Layer } from "effect";
import { AuthConfig } from "./config";
import { importRsaPublicKeyFromPem } from "./crypto";
import { parseJwt, timeClaimsValid, verifyRs256Jwt } from "./jwt";

export interface ClerkIdentity {
  readonly sub: string;
}

/**
 * Networkless Clerk session-JWT verification (#145 keeps Clerk swappable behind
 * this thin adapter). Uses the `CLERK_JWT_KEY` PEM public key — no JWKS round
 * trip on the request path. Returns the external id (`sub`).
 */
export class ClerkTokenVerifier extends Context.Service<
  ClerkTokenVerifier,
  {
    readonly verify: (
      token: string
    ) => Effect.Effect<ClerkIdentity, UnauthorizedError>;
  }
>()("@delulu/services/ClerkTokenVerifier") {
  static readonly layer = Layer.effect(
    ClerkTokenVerifier,
    Effect.gen(function* () {
      const config = yield* AuthConfig;
      // Import the verification key once per layer build (per worker env).
      const key = yield* Effect.tryPromise({
        try: () => importRsaPublicKeyFromPem(config.clerkJwtKey),
        catch: () =>
          new UnauthorizedError({
            message: "Clerk verification key is misconfigured",
          }),
      }).pipe(Effect.orDie);

      const verify = (token: string) =>
        Effect.gen(function* () {
          const parsed = parseJwt(token);
          if (parsed === null || parsed.header.alg !== "RS256") {
            return yield* Effect.fail(
              new UnauthorizedError({ message: "Malformed session token" })
            );
          }
          const valid = yield* Effect.tryPromise({
            try: () => verifyRs256Jwt(parsed, key),
            catch: () =>
              new UnauthorizedError({
                message: "Session token verification failed",
              }),
          });
          const now = Math.floor(Date.now() / 1000);
          if (!(valid && timeClaimsValid(parsed.claims, { now }))) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Invalid or expired session token",
              })
            );
          }
          if (config.clerkIssuer && parsed.claims.iss !== config.clerkIssuer) {
            return yield* Effect.fail(
              new UnauthorizedError({ message: "Untrusted token issuer" })
            );
          }
          const sub = parsed.claims.sub;
          if (typeof sub !== "string" || sub.length === 0) {
            return yield* Effect.fail(
              new UnauthorizedError({
                message: "Session token is missing a subject",
              })
            );
          }
          return { sub } satisfies ClerkIdentity;
        });

      return ClerkTokenVerifier.of({ verify });
    })
  );
}
