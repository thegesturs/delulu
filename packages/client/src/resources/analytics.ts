import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectQuery } from "../query.js";
import { defineResourceOptions, type EndpointQuery } from "./shared.js";

export type InsightsQuery = EndpointQuery<ApiClient["analytics"]["insights"]>;

export const createAnalyticsOptions = defineResourceOptions(
  ({ client, runner }) => ({
    operational: (workspaceId: string) =>
      effectQuery({
        queryKey: workspaceKeys.resource(workspaceId, "analytics-operational"),
        effect: () => client.analytics.operational({ params: { workspaceId } }),
        runner,
      }),
    insights: (
      workspaceId: string,
      connectionId: string,
      query: InsightsQuery = {}
    ) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "analytics-insights", {
          connectionId,
          ...query,
        }),
        effect: () =>
          client.analytics.insights({
            params: { workspaceId, connectionId },
            query,
          }),
        runner,
      }),
  })
);
