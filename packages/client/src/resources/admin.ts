import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type AdminPageQuery = EndpointQuery<ApiClient["admin"]["members"]>;

export const createAdminEffects = defineResourceEffects(({ client }) => ({
  workspace: (workspaceId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.detail(workspaceId, "admin", "workspace"),
      effect: () => client.admin.workspace({ params: { workspaceId } }),
    }),
  members: (workspaceId: string, query: AdminPageQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "members", query),
      effect: () => client.admin.members({ params: { workspaceId }, query }),
    }),
  apiKeys: (workspaceId: string, query: AdminPageQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "api-keys", query),
      effect: () => client.admin.apiKeys({ params: { workspaceId }, query }),
    }),
  updateWorkspace: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "admin"),
      effect: (
        payload: EndpointPayload<ApiClient["admin"]["updateWorkspace"]>
      ) => client.admin.updateWorkspace({ params: { workspaceId }, payload }),
    }),
  deleteWorkspace: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "admin"),
      effect: () => client.admin.deleteWorkspace({ params: { workspaceId } }),
    }),
  inviteMember: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "members"),
      effect: (payload: EndpointPayload<ApiClient["admin"]["inviteMember"]>) =>
        client.admin.inviteMember({ params: { workspaceId }, payload }),
    }),
  updateMember: (workspaceId: string, id: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.detail(workspaceId, "members", id),
      effect: (payload: EndpointPayload<ApiClient["admin"]["updateMember"]>) =>
        client.admin.updateMember({ params: { workspaceId, id }, payload }),
    }),
  removeMember: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "members"),
      effect: (id: string) =>
        client.admin.removeMember({ params: { workspaceId, id } }),
    }),
  createApiKey: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "api-keys"),
      effect: (payload: EndpointPayload<ApiClient["admin"]["createApiKey"]>) =>
        client.admin.createApiKey({ params: { workspaceId }, payload }),
    }),
  revokeApiKey: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "api-keys"),
      effect: (id: string) =>
        client.admin.revokeApiKey({ params: { workspaceId, id } }),
    }),
}));
