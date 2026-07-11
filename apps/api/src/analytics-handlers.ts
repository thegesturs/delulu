import { Api } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import { AnalyticsService, WorkspaceAccessService } from "@delulu/services";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthenticationLive } from "./auth-middleware";

export const AnalyticsHandlers = HttpApiBuilder.group(
  Api,
  "analytics",
  Effect.fnUntraced(function* (handlers) {
    const analytics = yield* AnalyticsService;
    const workspaces = yield* WorkspaceAccessService;
    return handlers
      .handle("operational", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "stats:read",
          });
          return yield* analytics.operational(access.workspaceId);
        })
      )
      .handle("insights", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "stats:read",
          });
          return yield* analytics.insights({
            workspaceId: access.workspaceId,
            connectionId: params.connectionId,
            windowDays: Math.min(90, Math.max(1, query.windowDays ?? 30)),
          });
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
