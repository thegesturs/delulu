import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type AdminPageQuery = EndpointQuery<ApiClient["admin"]["members"]>;

export const createAdminOptions = defineResourceOptions(
  ({ client, runner }) => ({
    workspace: (workspaceId: string) =>
      effectQuery({
        queryKey: workspaceKeys.detail(workspaceId, "admin", "workspace"),
        effect: () => client.admin.workspace({ params: { workspaceId } }),
        runner,
      }),
    members: (workspaceId: string, query: AdminPageQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "members", query),
        effect: () => client.admin.members({ params: { workspaceId }, query }),
        runner,
      }),
    apiKeys: (workspaceId: string, query: AdminPageQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "api-keys", query),
        effect: () => client.admin.apiKeys({ params: { workspaceId }, query }),
        runner,
      }),
    updateWorkspace: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "admin"),
        effect: (
          payload: EndpointPayload<ApiClient["admin"]["updateWorkspace"]>
        ) => client.admin.updateWorkspace({ params: { workspaceId }, payload }),
        runner,
      }),
    deleteWorkspace: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "admin"),
        effect: () => client.admin.deleteWorkspace({ params: { workspaceId } }),
        runner,
      }),
    inviteMember: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "members"),
        effect: (
          payload: EndpointPayload<ApiClient["admin"]["inviteMember"]>
        ) => client.admin.inviteMember({ params: { workspaceId }, payload }),
        runner,
      }),
    updateMember: (workspaceId: string, id: string) =>
      effectMutation({
        mutationKey: workspaceKeys.detail(workspaceId, "members", id),
        effect: (
          payload: EndpointPayload<ApiClient["admin"]["updateMember"]>
        ) =>
          client.admin.updateMember({ params: { workspaceId, id }, payload }),
        runner,
      }),
    removeMember: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "members"),
        effect: (id: string) =>
          client.admin.removeMember({ params: { workspaceId, id } }),
        runner,
      }),
    createApiKey: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "api-keys"),
        effect: (
          payload: EndpointPayload<ApiClient["admin"]["createApiKey"]>
        ) => client.admin.createApiKey({ params: { workspaceId }, payload }),
        runner,
      }),
    revokeApiKey: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "api-keys"),
        effect: (id: string) =>
          client.admin.revokeApiKey({ params: { workspaceId, id } }),
        runner,
      }),
  })
);
