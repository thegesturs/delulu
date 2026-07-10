import { Api } from "@delulu/contracts";
import type {
  ApiKeyVerifier,
  AsTokenService,
  AuthConfig,
  ClerkTokenVerifier,
  IdentityService,
  MembershipService,
  OAuthFlowService,
  QuotaGuard,
  RateLimiterService,
} from "@delulu/services";
import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import type { SqlClient } from "effect/unstable/sql";
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
  | RateLimiterService;

/**
 * Assemble the typed HttpApi (health + me), Scalar docs, `/openapi.json`, and
 * the plain OAuth AS routes into a single fetch handler, provided by `base`
 * (built per Worker env). Built once per env object and memoized by the caller.
 */
export const buildWebHandler = (base: Layer.Layer<AppServices>) => {
  const ApiRoutes = HttpApiBuilder.layer(Api, {
    openapiPath: "/openapi.json",
  }).pipe(Layer.provide([HealthHandlers, MeHandlers]));

  const DocsRoute = HttpApiScalar.layer(Api, { path: "/docs" });

  const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute, OAuthRoutes).pipe(
    Layer.provide(base),
    Layer.provide(HttpServer.layerServices)
  );

  return HttpRouter.toWebHandler(AllRoutes);
};
