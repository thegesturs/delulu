import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type MediaPageQuery = EndpointQuery<ApiClient["media"]["list"]>;

export const createMediaOptions = defineResourceOptions(
  ({ client, runner }) => ({
    list: (workspaceId: string, query: MediaPageQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "media", query),
        effect: () => client.media.list({ params: { workspaceId }, query }),
        runner,
      }),
    get: (workspaceId: string, id: string) =>
      effectQuery({
        queryKey: workspaceKeys.detail(workspaceId, "media", id),
        effect: () => client.media.get({ params: { workspaceId, id } }),
        runner,
      }),
    uploads: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "media"),
        effect: (payload: EndpointPayload<ApiClient["media"]["uploads"]>) =>
          client.media.uploads({ params: { workspaceId }, payload }),
        runner,
      }),
    complete: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "media"),
        effect: (payload: EndpointPayload<ApiClient["media"]["complete"]>) =>
          client.media.complete({ params: { workspaceId }, payload }),
        runner,
      }),
    remove: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "media"),
        effect: (id: string) =>
          client.media.remove({ params: { workspaceId, id } }),
        runner,
      }),
  })
);
