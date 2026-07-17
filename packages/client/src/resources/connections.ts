import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type ConnectionsPageQuery = EndpointQuery<
  ApiClient["connections"]["list"]
>;

export const createConnectionEffects = defineResourceEffects(({ client }) => ({
  list: (workspaceId: string, query: ConnectionsPageQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "connections", query),
      effect: () => client.connections.list({ params: { workspaceId }, query }),
    }),
  remove: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "connections"),
      effect: (id: string) =>
        client.connections.remove({ params: { workspaceId, id } }),
    }),
  mint: (workspaceId: string, platform: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "connections"),
      effect: (payload: EndpointPayload<ApiClient["connections"]["mint"]>) =>
        client.connections.mint({
          params: { workspaceId, platform },
          payload,
        }),
    }),
  confirmTransfer: (workspaceId: string, id: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.detail(workspaceId, "connections", id),
      effect: (
        payload: EndpointPayload<ApiClient["connections"]["confirmTransfer"]>
      ) =>
        client.connections.confirmTransfer({
          params: { workspaceId, id },
          payload,
        }),
    }),
}));
