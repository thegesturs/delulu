import { makeTokenCipher, TokenCipher } from "@delulu/core";
import {
  AdminService,
  AnalyticsService,
  ApiKeyVerifier,
  AsTokenService,
  AuthorizationService,
  AutomationEngine,
  AutomationKvNamespace,
  AutomationKvRepairJob,
  AutomationKvService,
  AutomationService,
  AutomationSessionService,
  BillingOwnerTransfers,
  BillingReconciliation,
  BillingService,
  BillingWebhookApplication,
  ClerkAdminService,
  ClerkSyncService,
  ClerkTokenVerifier,
  ConnectionStateService,
  ConnectionsService,
  DmDispatchService,
  IdentityService,
  JobService,
  MediaService,
  MembershipService,
  makeAnalyticsCacheLayer,
  makeMemoryAnalyticsCacheLayer,
  OAuthFlowService,
  PooledQuotaReservations,
  PostService,
  QuotaGuard,
  R2Service,
  RateLimiterService,
  ReviewService,
  SignedIngress,
  TranscriptionCheckoutConfig,
  TranscriptionCheckoutService,
  TranscriptionService,
  WebhookDeliveryService,
  WebhookIngressService,
  WebhookSecrets,
  WorkspaceAccessService,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import { String as EffectString, Layer, Redacted } from "effect";
import { type AppServices, buildWebHandler } from "./app";
import {
  AutomationProviderLive,
  PaymentWebhookSinkLive,
} from "./automation-providers";
import { dispatchDueJobs } from "./dispatcher";
import {
  appOrigins,
  authConfigLayer,
  databaseUrl,
  domainConfigLayers,
  type Env,
  type ExecutionContext,
} from "./env";
import { LiveInsightsProviderLive } from "./live-insights";
import { runMaintenance } from "./maintenance";

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
    // Transform column names only, NOT the keys inside jsonb values. Our jsonb
    // content graphs (e.g. `automations.node_positions`, `trigger_config`) use
    // data-derived identifiers — step/note ids — as object keys, and those ids
    // are nanoids that can contain or end with `_`. Recursively camel-casing
    // jsonb keys corrupts such maps (`note_gfc_1` -> `noteGfc1`, breaking the
    // link to the step whose id is still `note_gfc_1`) and outright crashes on
    // a trailing `_` (`snakeToCamel` reads past the string end). jsonb is
    // written verbatim (`JSON.stringify(...)::jsonb`), so leaving it verbatim on
    // read keeps writes and reads symmetric.
    transformJson: false,
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
  const AnalyticsCache = env.EDGE_CACHE_KV
    ? makeAnalyticsCacheLayer(env.EDGE_CACHE_KV)
    : makeMemoryAnalyticsCacheLayer();
  const LiveInsights = LiveInsightsProviderLive.pipe(Layer.provide(Cipher));
  const Analytics = AnalyticsService.layer.pipe(
    Layer.provide([AnalyticsCache, LiveInsights])
  );
  const Billing = BillingService.layer;
  const BillingTransfers = BillingOwnerTransfers.layer;
  const BillingWebhooks = BillingWebhookApplication.layer;
  const BillingReconcile = BillingReconciliation.layer;
  const Transcriptions = TranscriptionService.layer;
  const TranscriptionCheckoutConfigLayer = Layer.succeed(
    TranscriptionCheckoutConfig,
    TranscriptionCheckoutConfig.of({
      apiKey: env.DODO_PAYMENTS_API_KEY ?? "",
      environment:
        env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
          ? "live_mode"
          : "test_mode",
      returnUrl: env.APP_BASE_URL ?? "http://localhost:3000",
    })
  );
  const TranscriptionCheckout = TranscriptionCheckoutService.layer.pipe(
    Layer.provide(TranscriptionCheckoutConfigLayer)
  );
  const QuotaReservations = PooledQuotaReservations.layer;
  const AutomationKvBinding = env.AUTOMATION_KV
    ? Layer.succeed(
        AutomationKvNamespace,
        AutomationKvNamespace.of(env.AUTOMATION_KV)
      )
    : AutomationKvService.memoryLayer();
  const AutomationKv = AutomationKvService.layer.pipe(
    Layer.provide(AutomationKvBinding)
  );
  const Automations = AutomationService.layer.pipe(Layer.provide(AutomationKv));
  const AutomationRepair = AutomationKvRepairJob.layer.pipe(
    Layer.provide(Automations)
  );
  const AutomationSessions = AutomationSessionService.layer.pipe(
    Layer.provide(AutomationKv)
  );
  const AutomationProviders = AutomationProviderLive.pipe(
    Layer.provide(Cipher)
  );
  const DmDispatch = DmDispatchService.layer.pipe(
    Layer.provide(AutomationProviders)
  );
  const AutomationRuntime = AutomationEngine.layer.pipe(
    Layer.provide([
      Automations,
      AutomationSessions,
      DmDispatch,
      AutomationProviders,
    ])
  );
  const WebhookDeliveries = WebhookDeliveryService.layer;
  const ClerkSync = ClerkSyncService.layer.pipe(
    Layer.provide(IdentityService.layer)
  );
  const PaymentSink = PaymentWebhookSinkLive.pipe(
    Layer.provide(BillingWebhooks)
  );
  const WebhookSecretConfig = Layer.succeed(
    WebhookSecrets,
    WebhookSecrets.of({
      metaAppSecret: env.META_APP_SECRET ?? "",
      metaVerifyToken: env.META_VERIFY_TOKEN ?? "",
      clerkSigningSecret: env.CLERK_WEBHOOK_SECRET ?? "",
      dodoSigningSecret: env.DODO_WEBHOOK_SECRET ?? "",
      timestampToleranceSeconds: 300,
    })
  );
  const WebhookVerification = SignedIngress.layer.pipe(
    Layer.provide(WebhookSecretConfig)
  );
  const WebhookIngress = WebhookIngressService.layer.pipe(
    Layer.provide([
      WebhookDeliveries,
      AutomationRuntime,
      ClerkSync,
      PaymentSink,
    ])
  );

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
    Admin,
    Analytics,
    Automations,
    AutomationRepair,
    Billing,
    BillingTransfers,
    BillingWebhooks,
    BillingReconcile,
    Transcriptions,
    TranscriptionCheckout,
    QuotaReservations,
    WebhookVerification,
    WebhookIngress
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

/**
 * Build the web handler (which owns the Postgres pool) fresh for a single
 * request and dispose it once the request settles.
 *
 * We cannot memoize the handler across requests: `@effect/sql-pg` uses
 * node-postgres, whose sockets (over `nodejs_compat`) are bound to the workerd
 * I/O context of the request that opened them. workerd cancels any request that
 * touches a socket opened by a *different* request — surfacing as an instant
 * "the Worker's code had hung" 500 (with no CORS headers, so the browser then
 * reports a CORS failure). A per-isolate shared pool therefore fails on every
 * request that reuses an idle connection. Building and disposing the pool per
 * request keeps every socket within one I/O context. In production Hyperdrive
 * holds the warm upstream pool, so the per-request connect stays cheap.
 */
const handleRequest = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
  const { handler, dispose } = buildWebHandler(makeBaseLayer(env), {
    allowedOrigins: appOrigins(env),
  });
  const run = (handler as WebHandler)(request);
  // Release the pool after the response is produced, out of band so it never
  // delays the response the client sees.
  ctx.waitUntil(run.then(dispose, dispose));
  return run;
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },
  scheduled(_controller: unknown, env: Env, ctx: ExecutionContext): void {
    const layer = makeBaseLayer(env);
    ctx.waitUntil(
      Promise.all([dispatchDueJobs(env, layer), runMaintenance(layer)]).then(
        () => undefined
      )
    );
  },
};
