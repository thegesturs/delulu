import { Context } from "effect";

/**
 * Per-deployment auth configuration, provided by the worker from its env/secrets.
 * Kept as a service (not read from `process.env` inside services) so the auth
 * stack composes cleanly per-request and stays testable.
 */
export class AuthConfig extends Context.Service<
  AuthConfig,
  {
    /** Clerk instance issuer, e.g. `https://xxx.clerk.accounts.dev`. */
    readonly clerkIssuer: string;
    /** Clerk networkless-verification PEM public key (`CLERK_JWT_KEY`). */
    readonly clerkJwtKey: string;
    /** Our own AS issuer — the API origin, e.g. `https://api.delulu.social`. */
    readonly asIssuer: string;
    /** The RFC 8707 audience our AS binds API tokens to. */
    readonly apiResource: string;
    /** App origin for user-facing links (e.g. the quota upgrade URL). */
    readonly appBaseUrl: string;
    /** ES256 signing key (PKCS#8 PEM) for our AS. Absent in Clerk-only envs. */
    readonly asSigningKeyPem?: string;
    /** Stable key id advertised in the JWKS for the AS signing key. */
    readonly asSigningKid?: string;
  }
>()("@delulu/services/AuthConfig") {}
