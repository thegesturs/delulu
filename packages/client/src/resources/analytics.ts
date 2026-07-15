import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { resourceEffect } from "../resource.js";
import { defineResourceEffects, type EndpointQuery } from "./shared.js";

export type InsightsQuery = EndpointQuery<ApiClient["analytics"]["insights"]>;

export const createAnalyticsEffects = defineResourceEffects(({ client }) => ({
  operational: (workspaceId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.resource(workspaceId, "analytics-operational"),
      effect: () => client.analytics.operational({ params: { workspaceId } }),
    }),
  insights: (
    workspaceId: string,
    connectionId: string,
    query: InsightsQuery = {}
  ) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "analytics-insights", {
        connectionId,
        ...query,
      }),
      effect: () =>
        client.analytics.insights({
          params: { workspaceId, connectionId },
          query,
        }),
    }),
}));
