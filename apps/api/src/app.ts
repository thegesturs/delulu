import { Api } from "@delulu/contracts";
import type {
  AdminService,
  AnalyticsService,
  ApiKeyVerifier,
  AsTokenService,
  AuthConfig,
  AuthorizationService,
  AutomationKvRepairJob,
  AutomationService,
  BillingOwnerTransfers,
  BillingProviderService,
  BillingReconciliation,
  BillingService,
  CalendarWebhookConfig,
  CancellationService,
  ClerkAdminService,
  ClerkTokenVerifier,
  ConnectionStateService,
  ConnectionsService,
  DeploymentConfig,
  EntitlementPolicy,
  IdentityService,
  JobService,
  LifecycleService,
  MediaService,
  MembershipService,
  MessagingService,
  OAuthFlowService,
  PostService,
  ProductAnalytics,
  QuotaGuard,
  R2Service,
  RateLimiterService,
  ReviewService,
  SetupService,
  SignedIngress,
  TranscriptionCheckoutService,
  TranscriptionService,
  WebhookIngressService,
  WorkspaceAccessService,
} from "@delulu/services";
import { Layer } from "effect";
import { HttpMiddleware, HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import type { SqlClient } from "effect/unstable/sql";
import { AnalyticsHandlers } from "./analytics-handlers";
import { AutomationHandlers } from "./automation-handlers";
import { BillingHandlers } from "./billing-handlers";
import { ConnectionRoutes } from "./connection-routes";
import {
  AdminHandlers,
  ConnectionsHandlers,
  MediaHandlers,
  PostsHandlers,
  ReviewsHandlers,
} from "./domain-handlers";
import { HealthHandlers, InstanceHandlers, MeHandlers } from "./handlers";
import { OAuthRoutes } from "./oauth-routes";
import { TranscriptionHandlers } from "./transcription-handlers";
import { WebhookRoutes } from "./webhook-routes";

/** Everything the assembled routes need a per-request environment to provide. */
export type AppServices =
  | SqlClient.SqlClient
  | DeploymentConfig
  | EntitlementPolicy
  | AuthConfig
  | ClerkTokenVerifier
  | AsTokenService
  | ApiKeyVerifier
  | IdentityService
  | MembershipService
  | OAuthFlowService
  | QuotaGuard
  | ProductAnalytics
  | RateLimiterService
  | AuthorizationService
  | WorkspaceAccessService
  | JobService
  | LifecycleService
  | PostService
  | MediaService
  | MessagingService
  | R2Service
  | ConnectionsService
  | ConnectionStateService
  | ReviewService
  | AdminService
  | AnalyticsService
  | AutomationKvRepairJob
  | AutomationService
  | BillingService
  | BillingProviderService
  | CancellationService
  | CalendarWebhookConfig
  | BillingOwnerTransfers
  | BillingReconciliation
  | TranscriptionService
  | TranscriptionCheckoutService
  | SetupService
  | SignedIngress
  | WebhookIngressService
  | ClerkAdminService;

export interface WebHandlerOptions {
  readonly allowedOrigins: readonly string[];
}

/**
 * Assemble the typed HttpApi (health + me), Scalar docs, `/openapi.json`, and
 * the plain OAuth AS routes into a single fetch handler, provided by `base`
 * (built per Worker env). Built once per env object and memoized by the caller.
 */
export const buildWebHandler = (
  base: Layer.Layer<AppServices>,
  options: WebHandlerOptions = { allowedOrigins: [] }
) => {
  const ApiRoutes = HttpApiBuilder.layer(Api, {
    openapiPath: "/openapi.json",
  }).pipe(
    Layer.provide([
      HealthHandlers,
      InstanceHandlers,
      MeHandlers,
      PostsHandlers,
      ReviewsHandlers,
      MediaHandlers,
      ConnectionsHandlers,
      AdminHandlers,
      AnalyticsHandlers,
      AutomationHandlers,
      BillingHandlers,
      TranscriptionHandlers,
    ])
  );

  const DocsRoute = HttpApiScalar.layer(Api, { path: "/docs" });
  const CorsMiddleware = HttpRouter.middleware(
    HttpMiddleware.cors({
      allowedOrigins: (origin) => options.allowedOrigins.includes(origin),
      // Empty ⇒ reflect the browser's Access-Control-Request-Headers. The typed
      // client attaches trace-propagation headers (W3C `traceparent`/`tracestate`
      // and Zipkin `b3`); reflecting avoids enumerating an open-ended set. The
      // origin allowlist above is the real access boundary; auth is enforced
      // per-route regardless of which headers are sent.
      allowedHeaders: [],
      exposedHeaders: ["retry-after"],
      maxAge: 86_400,
    }),
    { global: true }
  );

  const AllRoutes = Layer.mergeAll(
    ApiRoutes,
    DocsRoute,
    OAuthRoutes,
    ConnectionRoutes,
    WebhookRoutes
  ).pipe(
    Layer.provide(CorsMiddleware),
    Layer.provide(base),
    Layer.provide(HttpServer.layerServices)
  );

  return HttpRouter.toWebHandler(AllRoutes);
};
