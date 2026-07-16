import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type PostsPageQuery = EndpointQuery<ApiClient["posts"]["list"]>;

export const createPostEffects = defineResourceEffects(({ client }) => ({
  list: (workspaceId: string, query: PostsPageQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "posts", query),
      effect: () => client.posts.list({ params: { workspaceId }, query }),
    }),
  get: (workspaceId: string, id: string) =>
    resourceEffect({
      queryKey: workspaceKeys.detail(workspaceId, "posts", id),
      effect: () => client.posts.get({ params: { workspaceId, id } }),
    }),
  publishNow: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "posts"),
      effect: (id: string) =>
        client.posts.publishNow({ params: { workspaceId, id } }),
    }),
  targets: (workspaceId: string, id: string) =>
    resourceEffect({
      queryKey: workspaceKeys.detail(workspaceId, "post-targets", id),
      effect: () => client.posts.targets({ params: { workspaceId, id } }),
    }),
  create: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "posts"),
      effect: (payload: EndpointPayload<ApiClient["posts"]["create"]>) =>
        client.posts.create({ params: { workspaceId }, payload }),
    }),
  bulkCreate: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "posts"),
      effect: (payload: EndpointPayload<ApiClient["posts"]["bulkCreate"]>) =>
        client.posts.bulkCreate({ params: { workspaceId }, payload }),
    }),
  update: (workspaceId: string, id: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.detail(workspaceId, "posts", id),
      effect: (payload: EndpointPayload<ApiClient["posts"]["update"]>) =>
        client.posts.update({ params: { workspaceId, id }, payload }),
    }),
  remove: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "posts"),
      effect: (id: string) =>
        client.posts.remove({ params: { workspaceId, id } }),
    }),
  updateTarget: (workspaceId: string, id: string, targetId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.detail(workspaceId, "post-targets", id),
      invalidates: [
        workspaceKeys.resource(workspaceId, "posts"),
        workspaceKeys.resource(workspaceId, "post-targets"),
      ],
      effect: (payload: EndpointPayload<ApiClient["posts"]["updateTarget"]>) =>
        client.posts.updateTarget({
          params: { workspaceId, id, targetId },
          payload,
        }),
    }),
  retryTarget: (workspaceId: string, id: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.detail(workspaceId, "post-targets", id),
      invalidates: [
        workspaceKeys.resource(workspaceId, "posts"),
        workspaceKeys.resource(workspaceId, "post-targets"),
      ],
      effect: (targetId: string) =>
        client.posts.retryTarget({
          params: { workspaceId, id, targetId },
        }),
    }),
}));
