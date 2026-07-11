import { CurrentAuth } from "@delulu/core";
import { Effect, Layer } from "effect";
import { HttpApi, HttpApiBuilder } from "effect/unstable/httpapi";
import { AnalyticsGroup } from "../../../packages/contracts/src/analytics";
import { AnalyticsService } from "../../../packages/services/src/analytics";
import { WorkspaceAccessService } from "../../../packages/services/src/workspace-access";
import { AuthenticationLive } from "./auth-middleware";

/** Standalone lane API; shared assembly should add AnalyticsGroup to Api. */
export const AnalyticsApi = HttpApi.make("analyticsApi").add(AnalyticsGroup);

export const AnalyticsHandlers = HttpApiBuilder.group(
  AnalyticsApi,
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
