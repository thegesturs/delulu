import {
  ApiKeyVerifier,
  AsTokenService,
  ClerkTokenVerifier,
  IdentityService,
  MembershipService,
  OAuthFlowService,
  QuotaGuard,
  RateLimiterService,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import { String as EffectString, Layer, Redacted } from "effect";
import { type AppServices, buildWebHandler } from "./app";
import {
  authConfigLayer,
  databaseUrl,
  type Env,
  type ExecutionContext,
} from "./env";

/**
 * Build the per-request service environment from the Worker `env`. Rate limiting
 * uses the Cloudflare bindings when present, else an in-memory limiter (local
 * dev / `wrangler dev`). Postgres comes via Hyperdrive in production.
 */
const makeBaseLayer = (env: Env): Layer.Layer<AppServices> => {
  const Pg = PgClient.layer({
    url: Redacted.make(databaseUrl(env)),
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: true,
  });
  const Config = authConfigLayer(env);
  const AsToken = AsTokenService.layer;
  const Clerk = ClerkTokenVerifier.layer;

  const RateLimiter =
    env.RL_API_20 && env.RL_API_60 && env.RL_API_120 && env.RL_SESSION_300
      ? RateLimiterService.workersLayer({
          api20: env.RL_API_20,
          api60: env.RL_API_60,
          api120: env.RL_API_120,
          session300: env.RL_SESSION_300,
        })
      : RateLimiterService.inMemoryLayer();

  return Layer.mergeAll(
    IdentityService.layer,
    MembershipService.layer,
    ApiKeyVerifier.layer,
    OAuthFlowService.layer,
    QuotaGuard.layer,
    RateLimiter,
    AsToken,
    Clerk,
    Config
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
  const built = buildWebHandler(makeBaseLayer(env));
  const handler = built.handler as WebHandler;
  cached = { env, handler };
  return handler;
};

export default {
  fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handlerFor(env)(request);
  },
};
