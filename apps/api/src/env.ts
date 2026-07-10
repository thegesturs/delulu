import type { CfRateLimiter } from "@delulu/services";
import { AuthConfig } from "@delulu/services";
import { Layer } from "effect";

/** Cloudflare Hyperdrive binding (Postgres connection pooler). */
export interface Hyperdrive {
  readonly connectionString: string;
}

/**
 * The Cloudflare Worker environment. Rate-limit bindings and Hyperdrive are only
 * present in a deployed Worker; local `wrangler dev`/tests fall back to
 * `DATABASE_URL` and the in-memory rate limiter.
 */
export interface Env {
  readonly DATABASE_URL?: string;
  readonly HYPERDRIVE?: Hyperdrive;

  readonly CLERK_ISSUER?: string;
  readonly CLERK_JWT_KEY?: string;
  readonly AS_ISSUER?: string;
  readonly API_RESOURCE?: string;
  readonly APP_BASE_URL?: string;
  readonly AS_SIGNING_KEY?: string;
  readonly AS_SIGNING_KID?: string;

  readonly RL_API_20?: CfRateLimiter;
  readonly RL_API_60?: CfRateLimiter;
  readonly RL_API_120?: CfRateLimiter;
  readonly RL_SESSION_300?: CfRateLimiter;
}

/** Minimal execution-context shape (`waitUntil` for out-of-band work). */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export const databaseUrl = (env: Env): string =>
  env.HYPERDRIVE?.connectionString ??
  env.DATABASE_URL ??
  "postgres://delulu:delulu@localhost:5432/delulu";

/** Build the `AuthConfig` layer from the Worker env. */
export const authConfigLayer = (env: Env): Layer.Layer<AuthConfig> =>
  Layer.succeed(
    AuthConfig,
    AuthConfig.of({
      clerkIssuer: env.CLERK_ISSUER ?? "",
      clerkJwtKey: env.CLERK_JWT_KEY ?? "",
      asIssuer: env.AS_ISSUER ?? "http://localhost:8787",
      apiResource: env.API_RESOURCE ?? env.AS_ISSUER ?? "http://localhost:8787",
      appBaseUrl: env.APP_BASE_URL ?? "http://localhost:3000",
      asSigningKeyPem: env.AS_SIGNING_KEY,
      asSigningKid: env.AS_SIGNING_KID,
    })
  );
