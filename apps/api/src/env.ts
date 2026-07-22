import type {
  CfRateLimiter,
  KeyValueCacheBinding,
  WorkersKvNamespace,
} from "@delulu/services";
import {
  AuthConfig,
  ClerkAdminConfig,
  ConnectionStateConfig,
  PostHogConfig,
  R2Config,
} from "@delulu/services";
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
  readonly DELULU_DEPLOYMENT_MODE?: "hosted" | "self_hosted";
  readonly DELULU_PUBLISH_TRANSPORT?: "sqs" | "postgres";
  readonly DELULU_REGISTRATION_ENABLED?: string;
  readonly DELULU_VERSION?: string;
  readonly DELULU_COMMUNITY_API_RATE_PER_MINUTE?: string;

  readonly CLERK_ISSUER?: string;
  readonly CLERK_JWT_KEY?: string;
  readonly AS_ISSUER?: string;
  readonly API_RESOURCE?: string;
  readonly APP_BASE_URL?: string;
  readonly AS_SIGNING_KEY?: string;
  readonly AS_SIGNING_KEY_BASE64?: string;
  readonly AS_SIGNING_KID?: string;
  readonly CLERK_SECRET_KEY?: string;
  readonly CONNECTION_STATE_SECRET?: string;
  readonly R2_ACCOUNT_ID?: string;
  readonly R2_ACCESS_KEY_ID?: string;
  readonly R2_SECRET_ACCESS_KEY?: string;
  readonly R2_BUCKET_NAME?: string;
  readonly R2_PUBLIC_BASE_URL?: string;
  readonly ENCRYPTION_SECRET?: string;
  readonly SQS_INGRESS_URL?: string;
  readonly SQS_INGRESS_SECRET?: string;
  readonly EDGE_CACHE_KV?: KeyValueCacheBinding;
  readonly AUTOMATION_KV?: WorkersKvNamespace;
  readonly META_APP_SECRET?: string;
  readonly META_VERIFY_TOKEN?: string;
  readonly CLERK_WEBHOOK_SECRET?: string;
  readonly DODO_WEBHOOK_SECRET?: string;
  readonly DODO_PAYMENTS_API_KEY?: string;
  readonly DODO_PAYMENTS_ENVIRONMENT?: "test_mode" | "live_mode";
  readonly CLOUDFLARE_EMAIL_FROM?: string;
  readonly LOOPS_API_KEY?: string;
  readonly CAL_WEBHOOK_SECRET?: string;
  readonly CAL_RETENTION_EVENT_SLUG?: string;
  readonly EMAIL?: {
    send(input: {
      readonly from: string;
      readonly to: string;
      readonly subject: string;
      readonly html: string;
      readonly text: string;
      readonly headers?: Readonly<Record<string, string>>;
    }): Promise<void>;
  };
  readonly POSTHOG_KEY?: string;
  readonly POSTHOG_HOST?: string;
  readonly ENVIRONMENT?: string;

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

/** Browser origins permitted to call the Worker directly. */
export const appOrigins = (env: Env): readonly string[] => {
  const configured = env.APP_BASE_URL ?? "http://localhost:3000";
  try {
    return [new URL(configured).origin];
  } catch {
    return ["http://localhost:3000"];
  }
};

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
      asSigningKeyPem:
        env.AS_SIGNING_KEY ??
        (env.AS_SIGNING_KEY_BASE64
          ? new TextDecoder().decode(
              Uint8Array.from(atob(env.AS_SIGNING_KEY_BASE64), (character) =>
                character.charCodeAt(0)
              )
            )
          : undefined),
      asSigningKid: env.AS_SIGNING_KID,
    })
  );

/** Build the `PostHogConfig` layer from the Worker env. Disabled when no key. */
export const postHogConfigLayer = (env: Env): Layer.Layer<PostHogConfig> =>
  Layer.succeed(
    PostHogConfig,
    PostHogConfig.of({
      apiKey: env.POSTHOG_KEY ?? "",
      host: env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      environment: env.ENVIRONMENT ?? "development",
      enabled: Boolean(env.POSTHOG_KEY),
    })
  );

export const domainConfigLayers = (env: Env) =>
  [
    Layer.succeed(
      ClerkAdminConfig,
      ClerkAdminConfig.of({ secretKey: env.CLERK_SECRET_KEY ?? "" })
    ),
    Layer.succeed(
      ConnectionStateConfig,
      ConnectionStateConfig.of({ secret: env.CONNECTION_STATE_SECRET ?? "" })
    ),
    Layer.succeed(
      R2Config,
      R2Config.of({
        accountId: env.R2_ACCOUNT_ID ?? "",
        accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
        bucket: env.R2_BUCKET_NAME ?? "delulu-social",
        publicBaseUrl: env.R2_PUBLIC_BASE_URL ?? "https://media.delulu.social",
      })
    ),
  ] as const;
