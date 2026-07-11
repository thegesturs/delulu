import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type ConnectionsPageQuery = EndpointQuery<
  ApiClient["connections"]["list"]
>;

export const createConnectionOptions = defineResourceOptions(
  ({ client, runner }) => ({
    list: (workspaceId: string, query: ConnectionsPageQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "connections", query),
        effect: () =>
          client.connections.list({ params: { workspaceId }, query }),
        runner,
      }),
    remove: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "connections"),
        effect: (id: string) =>
          client.connections.remove({ params: { workspaceId, id } }),
        runner,
      }),
    mint: (workspaceId: string, platform: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "connections"),
        effect: (payload: EndpointPayload<ApiClient["connections"]["mint"]>) =>
          client.connections.mint({
            params: { workspaceId, platform },
            payload,
          }),
        runner,
      }),
    confirmTransfer: (workspaceId: string, id: string) =>
      effectMutation({
        mutationKey: workspaceKeys.detail(workspaceId, "connections", id),
        effect: (
          payload: EndpointPayload<ApiClient["connections"]["confirmTransfer"]>
        ) =>
          client.connections.confirmTransfer({
            params: { workspaceId, id },
            payload,
          }),
        runner,
      }),
  })
);
