import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type PostsPageQuery = EndpointQuery<ApiClient["posts"]["list"]>;

export const createPostOptions = defineResourceOptions(
  ({ client, runner }) => ({
    list: (workspaceId: string, query: PostsPageQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "posts", query),
        effect: () => client.posts.list({ params: { workspaceId }, query }),
        runner,
      }),
    get: (workspaceId: string, id: string) =>
      effectQuery({
        queryKey: workspaceKeys.detail(workspaceId, "posts", id),
        effect: () => client.posts.get({ params: { workspaceId, id } }),
        runner,
      }),
    publishNow: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "posts"),
        effect: (id: string) =>
          client.posts.publishNow({ params: { workspaceId, id } }),
        runner,
      }),
    targets: (workspaceId: string, id: string) =>
      effectQuery({
        queryKey: workspaceKeys.detail(workspaceId, "post-targets", id),
        effect: () => client.posts.targets({ params: { workspaceId, id } }),
        runner,
      }),
    create: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "posts"),
        effect: (payload: EndpointPayload<ApiClient["posts"]["create"]>) =>
          client.posts.create({ params: { workspaceId }, payload }),
        runner,
      }),
    bulkCreate: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "posts"),
        effect: (payload: EndpointPayload<ApiClient["posts"]["bulkCreate"]>) =>
          client.posts.bulkCreate({ params: { workspaceId }, payload }),
        runner,
      }),
    update: (workspaceId: string, id: string) =>
      effectMutation({
        mutationKey: workspaceKeys.detail(workspaceId, "posts", id),
        effect: (payload: EndpointPayload<ApiClient["posts"]["update"]>) =>
          client.posts.update({ params: { workspaceId, id }, payload }),
        runner,
      }),
    remove: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "posts"),
        effect: (id: string) =>
          client.posts.remove({ params: { workspaceId, id } }),
        runner,
      }),
    updateTarget: (workspaceId: string, id: string, targetId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.detail(workspaceId, "post-targets", id),
        effect: (
          payload: EndpointPayload<ApiClient["posts"]["updateTarget"]>
        ) =>
          client.posts.updateTarget({
            params: { workspaceId, id, targetId },
            payload,
          }),
        runner,
      }),
    retryTarget: (workspaceId: string, id: string) =>
      effectMutation({
        mutationKey: workspaceKeys.detail(workspaceId, "post-targets", id),
        effect: (targetId: string) =>
          client.posts.retryTarget({
            params: { workspaceId, id, targetId },
          }),
        runner,
      }),
  })
);
