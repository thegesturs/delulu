import { WorkerEntrypoint } from "cloudflare:workers";
import { PostWrite } from "@delulu/contracts";
import { makeTokenCipher, TokenCipher, WorkspaceId } from "@delulu/core";
import {
  AdminService,
  AgentWorkspaceService,
  AnalyticsService,
  ApiKeyVerifier,
  AsTokenService,
  AuthorizationService,
  AutomationEngine,
  AutomationKvNamespace,
  AutomationKvService,
  AutomationService,
  AutomationSessionService,
  BillingOwnerTransfers,
  BillingProviderConfig,
  BillingProviderService,
  BillingReconciliation,
  BillingService,
  BillingWebhookApplication,
  CalendarWebhookConfig,
  CancellationService,
  ClerkAdminService,
  ClerkSyncService,
  ClerkTokenVerifier,
  ConnectionStateService,
  ConnectionsService,
  DeploymentConfig,
  DmDispatchService,
  EntitlementPolicy,
  IdentityService,
  JobIntent,
  JobService,
  LifecycleService,
  MaintenanceScheduler,
  MediaService,
  MembershipService,
  MessagingService,
  makeAnalyticsCacheLayer,
  makeMemoryAnalyticsCacheLayer,
  OAuthFlowService,
  PooledQuotaReservations,
  PostService,
  ProductAnalytics,
  QuotaGuard,
  R2Service,
  RateLimiterService,
  ReviewService,
  SetupService,
  SignedIngress,
  TranscriptionCheckoutConfig,
  TranscriptionCheckoutService,
  TranscriptionService,
  WebhookDeliveryService,
  WebhookIngressService,
  WebhookSecrets,
  WorkspaceAccessService,
  WorkspaceFileService,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import {
  Effect,
  String as EffectString,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { SqlClient } from "effect/unstable/sql";
import { type AppServices, buildWebHandler } from "./app";
import {
  AutomationProviderLive,
  PaymentWebhookSinkLive,
} from "./automation-providers";
import { DurableJobObject, type JobState } from "./durable-job";
import {
  agentRuntimeProviderLayer,
  appOrigins,
  authConfigLayer,
  databaseUrl,
  domainConfigLayers,
  type Env,
  type ExecutionContext,
  postHogConfigLayer,
} from "./env";
import { executeJob, failJob } from "./execute-job";
import { jobTransportLayer, makeJobRuntime, sendIntent } from "./job-runtime";
import { LiveInsightsProviderLive } from "./live-insights";

import { messagingProvidersLayer } from "./messaging-providers";

/**
 * Build the per-request service environment from the Worker `env`. Rate limiting
 * uses the Cloudflare bindings when present, else an in-memory limiter (local
 * dev / `wrangler dev`). Postgres comes via Hyperdrive in production.
 */
export interface BaseLayerOverrides {
  readonly clerk?: Layer.Layer<ClerkTokenVerifier>;
  readonly clerkAdmin?: Layer.Layer<ClerkAdminService>;
  readonly rateLimiter?: Layer.Layer<RateLimiterService>;
}

export const makePgLayer = (env: Env) =>
  PgClient.layer({
    url: Redacted.make(databaseUrl(env)),
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: false,
  });

export const makeBaseLayer = (
  env: Env,
  overrides: BaseLayerOverrides = {}
): Layer.Layer<AppServices> => {
  // Transform column names only, NOT keys inside jsonb values. Content graphs
  // contain data-derived ids that recursive key transforms can corrupt.
  const Pg = makePgLayer(env);
  const Config = authConfigLayer(env);
  const Deployment = DeploymentConfig.layer({
    mode:
      env.DELULU_DEPLOYMENT_MODE === "self_hosted" ? "self_hosted" : "hosted",
    registrationEnabled: env.DELULU_REGISTRATION_ENABLED !== "false",
    version: env.DELULU_VERSION ?? "development",
    communityApiRatePerMinute: Number(
      env.DELULU_COMMUNITY_API_RATE_PER_MINUTE ?? 120
    ),
  });
  const Entitlements = EntitlementPolicy.layer.pipe(Layer.provide(Deployment));
  // Server-side product analytics. Disabled (fully inert) when POSTHOG_KEY is
  // unset. Flushes buffered events on layer dispose, which upstream runs inside
  // ctx.waitUntil for both the fetch and scheduled handlers. Defined early so it
  // can be provided into services that capture events (ClerkSync, billing).
  const Telemetry = ProductAnalytics.layer.pipe(
    Layer.provide(postHogConfigLayer(env))
  );
  const AsToken = AsTokenService.layer;
  const Clerk = overrides.clerk ?? ClerkTokenVerifier.layer;
  const [ClerkAdminConfig, ConnectionConfig, R2Config] =
    domainConfigLayers(env);
  const Authorization = AuthorizationService.layer;
  const Jobs = JobService.layer.pipe(Layer.provide(jobTransportLayer(env)));
  const ClerkAdmin =
    overrides.clerkAdmin ??
    ClerkAdminService.layer.pipe(Layer.provide(ClerkAdminConfig));
  const ConnectionState = ConnectionStateService.layer.pipe(
    Layer.provide(ConnectionConfig)
  );
  const Cipher = Layer.succeed(
    TokenCipher,
    TokenCipher.of(makeTokenCipher(env.ENCRYPTION_SECRET ?? ""))
  );
  const R2 = R2Service.layer.pipe(Layer.provide(R2Config));
  const AgentRuntime = agentRuntimeProviderLayer(env);
  const AgentWorkspaces = AgentWorkspaceService.layer.pipe(
    Layer.provide([AgentRuntime, Cipher])
  );
  const WorkspaceFiles = WorkspaceFileService.layer.pipe(
    Layer.provide([R2, QuotaGuard.layer.pipe(Layer.provide(Entitlements))])
  );
  const Access = WorkspaceAccessService.layer.pipe(
    Layer.provide([MembershipService.layer, Authorization, Entitlements])
  );
  const Posts = PostService.layer.pipe(Layer.provide(Jobs));
  const Reviews = ReviewService.layer.pipe(Layer.provide(Jobs));
  const Media = MediaService.layer.pipe(
    Layer.provide([
      Jobs,
      R2,
      QuotaGuard.layer.pipe(Layer.provide(Entitlements)),
    ])
  );
  const AutomationKvBinding = env.AUTOMATION_KV
    ? Layer.succeed(
        AutomationKvNamespace,
        AutomationKvNamespace.of(env.AUTOMATION_KV)
      )
    : AutomationKvService.memoryLayer();
  const Messaging = MessagingService.layer.pipe(
    Layer.provide([messagingProvidersLayer(env), Jobs])
  );
  const Lifecycle = LifecycleService.layer.pipe(
    Layer.provide([Messaging, Jobs])
  );
  const Connections = ConnectionsService.layer.pipe(
    Layer.provide([ConnectionState, Cipher, AutomationKvBinding, Lifecycle])
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
  const BillingProviderConfigLayer = Layer.succeed(
    BillingProviderConfig,
    BillingProviderConfig.of({
      apiKey: env.DODO_PAYMENTS_API_KEY ?? "",
      environment:
        env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
          ? "live_mode"
          : "test_mode",
      appBaseUrl: env.APP_BASE_URL ?? "http://localhost:3000",
    })
  );
  const BillingProvider = BillingProviderService.layer.pipe(
    Layer.provide(BillingProviderConfigLayer)
  );
  const Cancellations = CancellationService.layer.pipe(
    Layer.provide([
      BillingProvider,
      BillingProviderConfigLayer,
      Messaging,
      R2,
      Jobs,
    ])
  );
  const CalendarConfig = Layer.succeed(
    CalendarWebhookConfig,
    CalendarWebhookConfig.of({
      secret: env.CAL_WEBHOOK_SECRET ?? "",
      eventSlug: env.CAL_RETENTION_EVENT_SLUG ?? "retention",
    })
  );
  const BillingWebhooks = BillingWebhookApplication.layer.pipe(
    Layer.provide([Telemetry, Jobs])
  );
  const BillingReconcile = BillingReconciliation.layer;
  const Maintenance = MaintenanceScheduler.layer;
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
  const Setup = SetupService.layer.pipe(
    Layer.provide([ClerkAdmin, Entitlements])
  );
  const QuotaReservations = PooledQuotaReservations.layer.pipe(
    Layer.provide(Jobs)
  );
  const AutomationKv = AutomationKvService.layer.pipe(
    Layer.provide(AutomationKvBinding)
  );
  const Automations = AutomationService.layer.pipe(
    Layer.provide([AutomationKv, Jobs])
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
    Layer.provide([IdentityService.layer, Telemetry])
  );
  const PaymentSink = PaymentWebhookSinkLive.pipe(
    Layer.provide([BillingWebhooks, Messaging, Setup])
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
  const OAuthFlow = OAuthFlowService.layer.pipe(
    Layer.provide(MembershipService.layer)
  );

  return Layer.mergeAll(
    Cipher,
    IdentityService.layer,
    MembershipService.layer,
    ApiKeyVerifier.layer,
    OAuthFlow,
    QuotaGuard.layer.pipe(Layer.provide(Entitlements)),
    RateLimiter,
    Telemetry,
    Deployment,
    Entitlements,
    AsToken,
    Clerk,
    Config,
    Authorization,
    Jobs,
    ClerkAdmin,
    ConnectionState,
    R2,
    AgentRuntime,
    AgentWorkspaces,
    WorkspaceFiles,
    Access,
    Posts,
    Reviews,
    Media,
    Connections,
    Admin,
    Analytics,
    Automations,
    Billing,
    BillingProvider,
    Cancellations,
    CalendarConfig,
    Messaging,
    Lifecycle,
    BillingTransfers,
    BillingWebhooks,
    BillingReconcile,
    Maintenance,
    Transcriptions,
    TranscriptionCheckout,
    Setup,
    QuotaReservations,
    WebhookVerification,
    WebhookIngress
  ).pipe(
    Layer.provide(AsToken),
    Layer.provide(Config),
    Layer.provide(Entitlements),
    Layer.provideMerge(Pg),
    // Postgres connection-build failures become defects (500), not a typed
    // requirement leak into the handler.
    Layer.orDie
  );
};

interface AgentResponseTargetStub {
  readonly onGadgetResponse: (
    response: import("@delulu/services").AgentRuntimeResponse
  ) => Promise<void>;
}

interface AgentResponseTargetExports {
  readonly AgentResponseTarget: (options: {
    readonly props: { readonly runId: string };
  }) => AgentResponseTargetStub;
}

/** Trusted self-binding entrypoint that creates a persistent callback target. */
export class AgentRuntimeBridge extends WorkerEntrypoint<Env> {
  async ensureExternalUser(input: {
    readonly email: string;
    readonly displayName: string;
  }): Promise<void> {
    if (!this.env.AGENT_RUNTIME) {
      throw new Error("Agent runtime binding is not configured");
    }
    await this.env.AGENT_RUNTIME.ensureExternalUser(input);
  }

  async submitExternalMessage(input: {
    readonly correlationId: string;
    readonly callerEmail: string;
    readonly displayName: string;
    readonly gadgetKey: string;
    readonly chatKey: string;
    readonly messageKey: string;
    readonly gadgetTitle: string;
    readonly prompt: string;
  }) {
    if (!this.env.AGENT_RUNTIME) {
      throw new Error("Agent runtime binding is not configured");
    }
    const workerExports = this.ctx
      .exports as unknown as AgentResponseTargetExports;
    const chatGatewayRpcTarget = workerExports.AgentResponseTarget({
      props: { runId: input.correlationId },
    });
    return this.env.AGENT_RUNTIME.submitExternalMessage({
      callerEmail: input.callerEmail,
      gadgetKey: input.gadgetKey,
      chatKey: input.chatKey,
      messageKey: input.messageKey,
      gadgetTitle: input.gadgetTitle,
      prompt: input.prompt,
      chatGatewayRpcTarget,
    });
  }

  async interruptExternalRun(input: {
    readonly callerEmail: string;
    readonly gadgetKey: string;
    readonly chatKey: string;
    readonly messageKey: string;
  }): Promise<void> {
    if (!this.env.AGENT_RUNTIME) {
      throw new Error("Agent runtime binding is not configured");
    }
    await this.env.AGENT_RUNTIME.interruptExternalRun(input);
  }

  async resolveExternalAction(input: {
    readonly callerEmail: string;
    readonly gadgetKey: string;
    readonly actionId: string;
    readonly decision: "approved" | "rejected";
  }): Promise<void> {
    if (!this.env.AGENT_RUNTIME) {
      throw new Error("Agent runtime binding is not configured");
    }
    await this.env.AGENT_RUNTIME.resolveExternalAction(input);
  }
}

/** At-least-once runtime completion callback; database claims make delivery idempotent. */
export class AgentResponseTarget extends WorkerEntrypoint<
  Env,
  { readonly runId: string }
> {
  async onGadgetResponse(
    response: import("@delulu/services").AgentRuntimeResponse
  ): Promise<void> {
    const runId = this.ctx.props.runId;
    const program = Effect.gen(function* () {
      const agents = yield* AgentWorkspaceService;
      yield* agents.completeExternalResponse({
        runId,
        response,
      });
    });
    await Effect.runPromise(
      program.pipe(Effect.provide(makeBaseLayer(this.env)))
    );
  }
}

type ContentAction =
  | {
      readonly kind: "create_draft";
      readonly workspaceId: string;
      readonly value: unknown;
    }
  | {
      readonly kind: "update_draft";
      readonly workspaceId: string;
      readonly postId: string;
      readonly value: unknown;
    }
  | {
      readonly kind: "schedule";
      readonly workspaceId: string;
      readonly postId: string;
      readonly value: unknown;
    }
  | {
      readonly kind: "publish";
      readonly workspaceId: string;
      readonly postId: string;
    };

/** Tenant-authorized capability used only by the Content Gatekeeper binding. */
export class AgentContentBridge extends WorkerEntrypoint<Env> {
  async getContentContext(input: {
    readonly callerEmail: string;
    readonly workspaceId: string;
  }) {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const posts = yield* PostService;
      const workspaceId = yield* Schema.decodeUnknownEffect(WorkspaceId)(
        input.workspaceId
      );
      const members = yield* sql<{
        memberId: string;
        role: "owner" | "admin" | "editor" | "viewer";
        workspaceName: string;
      }>`SELECT wm.id AS member_id, wm.role, w.name AS workspace_name
          FROM users u
          JOIN workspace_members wm ON wm.user_id = u.id
          JOIN workspaces w ON w.id = wm.workspace_id
          WHERE lower(u.email) = ${input.callerEmail.trim().toLowerCase()}
            AND wm.workspace_id = ${input.workspaceId}
            AND u.identity_deleted_at IS NULL LIMIT 1`;
      const member = members[0];
      if (!member) {
        throw new Error("Content HQ workspace access denied");
      }
      const [connections, memories, files, recentPosts] = yield* Effect.all([
        sql<Record<string, unknown>>`SELECT id, platform, username, display_name
          FROM connections WHERE workspace_id = ${input.workspaceId}
          ORDER BY created_at DESC`,
        sql<Record<string, unknown>>`SELECT id, category, value, provenance,
          confidence, status, requires_confirmation, updated_at
          FROM agent_memories WHERE workspace_id = ${input.workspaceId}
            AND status != 'rejected' ORDER BY updated_at DESC LIMIT 100`,
        sql<Record<string, unknown>>`SELECT wf.id, wf.filename, wf.logical_path,
          wfv.mime_type, COALESCE(wfv.size_bytes, 0)::text AS size_bytes
          FROM workspace_files wf LEFT JOIN workspace_file_versions wfv
            ON wfv.id = wf.current_version_id
          WHERE wf.workspace_id = ${input.workspaceId} AND wf.deleted_at IS NULL
            AND wf.status = 'available' ORDER BY wf.updated_at DESC LIMIT 100`,
        posts.list({
          workspaceId,
          limit: 50,
          offset: 0,
        }),
      ]);
      return {
        workspace: {
          id: input.workspaceId,
          name: member.workspaceName,
          role: member.role,
        },
        connections: connections.map((connection) => ({
          id: String(connection.id),
          platform: String(connection.platform),
          username:
            connection.username == null ? null : String(connection.username),
          displayName:
            connection.displayName == null
              ? null
              : String(connection.displayName),
        })),
        recentPosts: recentPosts.data,
        memories,
        files: files.map((file) => ({
          id: String(file.id),
          filename: String(file.filename),
          logicalPath: String(file.logicalPath),
          mimeType: file.mimeType == null ? null : String(file.mimeType),
          sizeBytes: String(file.sizeBytes),
        })),
      };
    });
    return Effect.runPromise(
      program.pipe(Effect.provide(makeBaseLayer(this.env)))
    );
  }

  async executeContentAction(input: {
    readonly callerEmail: string;
    readonly action: ContentAction;
    readonly idempotencyKey: string;
  }) {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const posts = yield* PostService;
      const workspaceId = yield* Schema.decodeUnknownEffect(WorkspaceId)(
        input.action.workspaceId
      );
      const members = yield* sql<{
        memberId: string;
        role: "owner" | "admin" | "editor" | "viewer";
      }>`SELECT wm.id AS member_id, wm.role FROM users u
          JOIN workspace_members wm ON wm.user_id = u.id
          WHERE lower(u.email) = ${input.callerEmail.trim().toLowerCase()}
            AND wm.workspace_id = ${input.action.workspaceId}
            AND u.identity_deleted_at IS NULL LIMIT 1`;
      const actor = members[0];
      if (!actor || actor.role === "viewer") {
        throw new Error("Content HQ write access denied");
      }
      const claimed = yield* sql<{
        idempotencyKey: string;
      }>`INSERT INTO agent_external_effects
        (idempotency_key, caller_email, workspace_id, action_kind, status)
        VALUES (${input.idempotencyKey}, ${input.callerEmail.toLowerCase()},
          ${input.action.workspaceId}, ${input.action.kind}, 'executing')
        ON CONFLICT (idempotency_key) DO UPDATE SET
          status = 'executing', error = NULL, started_at = now()
        WHERE agent_external_effects.status = 'failed'
          OR agent_external_effects.updated_at < now() - interval '5 minutes'
        RETURNING idempotency_key`;
      if (!claimed[0]) {
        const existing = yield* sql<{
          status: string;
          result: unknown;
        }>`SELECT status, result
          FROM agent_external_effects WHERE idempotency_key = ${input.idempotencyKey}`;
        if (existing[0]?.status === "completed") {
          return existing[0].result;
        }
        throw new Error("Content action is already executing");
      }

      const postActor = { memberId: actor.memberId, role: actor.role };
      const execution = yield* Effect.gen(function* () {
        if (input.action.kind === "publish") {
          return yield* posts.publishNow({
            workspaceId,
            postId: input.action.postId,
            actor: postActor,
          });
        }
        const decoded = yield* Schema.decodeUnknownEffect(PostWrite)(
          input.action.value
        );
        const value =
          input.action.kind === "create_draft"
            ? {
                ...decoded,
                intent: "draft" as const,
                source: "automation" as const,
                externalSubmissionId: input.idempotencyKey,
              }
            : input.action.kind === "schedule"
              ? {
                  ...decoded,
                  intent: "schedule" as const,
                  source: "automation" as const,
                }
              : decoded;
        return input.action.kind === "create_draft"
          ? yield* posts.create({
              workspaceId,
              actor: postActor,
              value,
            })
          : yield* posts.update({
              workspaceId,
              postId: input.action.postId,
              actor: postActor,
              value,
            });
      }).pipe(Effect.result);
      if (execution._tag === "Failure") {
        yield* sql`UPDATE agent_external_effects SET status = 'failed'
          WHERE idempotency_key = ${input.idempotencyKey}`;
        return yield* Effect.fail(execution.failure);
      }
      yield* sql`UPDATE agent_external_effects SET status = 'completed',
        result = ${JSON.stringify(execution.success)}::jsonb, completed_at = now()
        WHERE idempotency_key = ${input.idempotencyKey}`;
      return execution.success;
    });
    return Effect.runPromise(
      program.pipe(Effect.provide(makeBaseLayer(this.env)))
    );
  }
}

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

/** Each idempotency key owns its durable execution state and alarm. */
export class JobExecutor extends DurableJobObject {
  constructor(state: JobState, env: Env) {
    super(state, {
      ...makeJobRuntime(
        () => makePgLayer(env),
        (job) => executeJob(job, makeBaseLayer(env)),
        (job, error) => failJob(job, error, makeBaseLayer(env))
      ),
      paused: env.SCHEDULER_PAUSED === "true",
    });
  }
}
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (new URL(request.url).pathname === "/internal/jobs") {
      if (
        !(env.JOBS && env.SCHEDULER_SECRET) ||
        request.headers.get("authorization") !==
          `Bearer ${env.SCHEDULER_SECRET}`
      ) {
        return new Response(null, { status: 401 });
      }
      if (request.method !== "POST") {
        return new Response(null, { status: 405 });
      }
      await sendIntent(
        env.JOBS,
        Schema.decodeUnknownSync(JobIntent)(await request.json())
      );
      return new Response(null, { status: 204 });
    }
    return handleRequest(request, env, ctx);
  },
};
