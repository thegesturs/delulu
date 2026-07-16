import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type MediaPageQuery = EndpointQuery<ApiClient["media"]["list"]>;

export const createMediaEffects = defineResourceEffects(({ client }) => ({
  list: (workspaceId: string, query: MediaPageQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "media", query),
      effect: () => client.media.list({ params: { workspaceId }, query }),
    }),
  get: (workspaceId: string, id: string) =>
    resourceEffect({
      queryKey: workspaceKeys.detail(workspaceId, "media", id),
      effect: () => client.media.get({ params: { workspaceId, id } }),
    }),
  uploads: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "media"),
      effect: (payload: EndpointPayload<ApiClient["media"]["uploads"]>) =>
        client.media.uploads({ params: { workspaceId }, payload }),
    }),
  import: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "media"),
      effect: (payload: EndpointPayload<ApiClient["media"]["import"]>) =>
        client.media.import({ params: { workspaceId }, payload }),
    }),
  complete: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "media"),
      effect: (payload: EndpointPayload<ApiClient["media"]["complete"]>) =>
        client.media.complete({ params: { workspaceId }, payload }),
    }),
  remove: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "media"),
      effect: (id: string) =>
        client.media.remove({ params: { workspaceId, id } }),
    }),
}));
