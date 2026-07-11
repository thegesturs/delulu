import { Api } from "@delulu/contracts";
import type {
  AdminService,
  ApiKeyVerifier,
  AsTokenService,
  AuthConfig,
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
import { Layer } from "effect";
import { HttpMiddleware, HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import type { SqlClient } from "effect/unstable/sql";
import { ConnectionRoutes } from "./connection-routes";
import {
  AdminHandlers,
  ConnectionsHandlers,
  MediaHandlers,
  PostsHandlers,
  ReviewsHandlers,
} from "./domain-handlers";
import { HealthHandlers, MeHandlers } from "./handlers";
import { OAuthRoutes } from "./oauth-routes";

/** Everything the assembled routes need a per-request environment to provide. */
export type AppServices =
  | SqlClient.SqlClient
  | AuthConfig
  | ClerkTokenVerifier
  | AsTokenService
  | ApiKeyVerifier
  | IdentityService
  | MembershipService
  | OAuthFlowService
  | QuotaGuard
  | RateLimiterService
  | AuthorizationService
  | WorkspaceAccessService
  | JobService
  | PostService
  | MediaService
  | R2Service
  | ConnectionsService
  | ConnectionStateService
  | ReviewService
  | AdminService
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
      MeHandlers,
      PostsHandlers,
      ReviewsHandlers,
      MediaHandlers,
      ConnectionsHandlers,
      AdminHandlers,
    ])
  );

  const DocsRoute = HttpApiScalar.layer(Api, { path: "/docs" });
  const CorsMiddleware = HttpRouter.middleware(
    HttpMiddleware.cors({
      allowedOrigins: (origin) => options.allowedOrigins.includes(origin),
      allowedHeaders: ["authorization", "content-type"],
      exposedHeaders: ["retry-after"],
      maxAge: 86_400,
    }),
    { global: true }
  );

  const AllRoutes = Layer.mergeAll(
    ApiRoutes,
    DocsRoute,
    OAuthRoutes,
    ConnectionRoutes
  ).pipe(
    Layer.provide(CorsMiddleware),
    Layer.provide(base),
    Layer.provide(HttpServer.layerServices)
  );

  return HttpRouter.toWebHandler(AllRoutes);
};
