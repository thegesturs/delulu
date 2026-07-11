import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type WorkspaceQueryKey = readonly [
  "workspace",
  workspaceId: string,
  resource: string,
  ...parts: readonly unknown[],
];

export const workspaceQueryKey = (
  workspaceId: string,
  resource: string,
  ...parts: readonly unknown[]
): WorkspaceQueryKey => ["workspace", workspaceId, resource, ...parts];

export const workspaceKeys = {
  all: ["workspace"] as const,
  workspace: (workspaceId: string) => ["workspace", workspaceId] as const,
  resource: (workspaceId: string, resource: string) =>
    workspaceQueryKey(workspaceId, resource),
  list: <Query extends object>(
    workspaceId: string,
    resource: string,
    query: Query
  ) => workspaceQueryKey(workspaceId, resource, "list", query),
  detail: (workspaceId: string, resource: string, id: string) =>
    workspaceQueryKey(workspaceId, resource, "detail", id),
};

export const invalidateKey = (queryClient: QueryClient, queryKey: QueryKey) =>
  queryClient.invalidateQueries({ queryKey });

export const invalidateWorkspace = (
  queryClient: QueryClient,
  workspaceId: string
) => invalidateKey(queryClient, workspaceKeys.workspace(workspaceId));

export const invalidateWorkspaceResource = (
  queryClient: QueryClient,
  workspaceId: string,
  resource: string
) => invalidateKey(queryClient, workspaceKeys.resource(workspaceId, resource));
