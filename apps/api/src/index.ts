import { makeTokenCipher, TokenCipher } from "@delulu/core";
import {
  AdminService,
  ApiKeyVerifier,
  AsTokenService,
  AuthorizationService,
  ClerkAdminService,
  ClerkTokenVerifier,
  ConnectionStateService,
  ConnectionsService,
  IdentityService,
  JobService,
  MediaService,
  MembershipService,
  OAuthFlowService,
  PostService,
  QuotaGuard,
  R2Service,
  RateLimiterService,
  ReviewService,
  WorkspaceAccessService,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import { String as EffectString, Layer, Redacted } from "effect";
import { type AppServices, buildWebHandler } from "./app";
import { dispatchDueJobs } from "./dispatcher";
import {
  appOrigins,
  authConfigLayer,
  databaseUrl,
  domainConfigLayers,
  type Env,
  type ExecutionContext,
} from "./env";

/**
 * Build the per-request service environment from the Worker `env`. Rate limiting
 * uses the Cloudflare bindings when present, else an in-memory limiter (local
 * dev / `wrangler dev`). Postgres comes via Hyperdrive in production.
 */
export interface BaseLayerOverrides {
  readonly clerk?: Layer.Layer<ClerkTokenVerifier>;
  readonly rateLimiter?: Layer.Layer<RateLimiterService>;
}

export const makeBaseLayer = (
  env: Env,
  overrides: BaseLayerOverrides = {}
): Layer.Layer<AppServices> => {
  const Pg = PgClient.layer({
    url: Redacted.make(databaseUrl(env)),
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: true,
  });
  const Config = authConfigLayer(env);
  const AsToken = AsTokenService.layer;
  const Clerk = overrides.clerk ?? ClerkTokenVerifier.layer;
  const [ClerkAdminConfig, ConnectionConfig, R2Config] =
    domainConfigLayers(env);
  const Authorization = AuthorizationService.layer;
  const Jobs = JobService.layer;
  const ClerkAdmin = ClerkAdminService.layer.pipe(
    Layer.provide(ClerkAdminConfig)
  );
  const ConnectionState = ConnectionStateService.layer.pipe(
    Layer.provide(ConnectionConfig)
  );
  const Cipher = Layer.succeed(
    TokenCipher,
    TokenCipher.of(makeTokenCipher(env.ENCRYPTION_SECRET ?? ""))
  );
  const R2 = R2Service.layer.pipe(Layer.provide(R2Config));
  const Access = WorkspaceAccessService.layer.pipe(
    Layer.provide([MembershipService.layer, Authorization])
  );
  const Posts = PostService.layer.pipe(Layer.provide(Jobs));
  const Reviews = ReviewService.layer.pipe(Layer.provide(Jobs));
  const Media = MediaService.layer.pipe(
    Layer.provide([Jobs, R2, QuotaGuard.layer])
  );
  const Connections = ConnectionsService.layer.pipe(
    Layer.provide([ConnectionState, Cipher])
  );
  const Admin = AdminService.layer.pipe(Layer.provide([ClerkAdmin, Jobs]));

  const RateLimiter =
    overrides.rateLimiter ??
    (env.RL_API_20 && env.RL_API_60 && env.RL_API_120 && env.RL_SESSION_300
      ? RateLimiterService.workersLayer({
          api20: env.RL_API_20,
          api60: env.RL_API_60,
          api120: env.RL_API_120,
          session300: env.RL_SESSION_300,
        })
      : RateLimiterService.inMemoryLayer());

  return Layer.mergeAll(
    IdentityService.layer,
    MembershipService.layer,
    ApiKeyVerifier.layer,
    OAuthFlowService.layer,
    QuotaGuard.layer,
    RateLimiter,
    AsToken,
    Clerk,
    Config,
    Authorization,
    Jobs,
    ClerkAdmin,
    ConnectionState,
    R2,
    Access,
    Posts,
    Reviews,
    Media,
    Connections,
    Admin
  ).pipe(
    Layer.provide(AsToken),
    Layer.provide(Config),
    Layer.provideMerge(Pg),
    // Postgres connection-build failures become defects (500), not a typed
    // requirement leak into the handler.
    Layer.orDie
  );
};

type WebHandler = (request: Request) => Promise<Response>;

// The env object is stable across requests in a Worker isolate, so building the
// handler once per env (keyed by identity) effectively builds it once per boot.
let cached: { readonly env: Env; readonly handler: WebHandler } | null = null;

const handlerFor = (env: Env): WebHandler => {
  if (cached && cached.env === env) {
    return cached.handler;
  }
  const built = buildWebHandler(makeBaseLayer(env), {
    allowedOrigins: appOrigins(env),
  });
  const handler = built.handler as WebHandler;
  cached = { env, handler };
  return handler;
};

export default {
  fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handlerFor(env)(request);
  },
  scheduled(_controller: unknown, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(dispatchDueJobs(env, makeBaseLayer(env)));
  },
};
