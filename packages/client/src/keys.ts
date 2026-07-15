import type { ResourceKey } from "./resource.js";

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

export const resourceKeyStartsWith = (
  key: ResourceKey,
  prefix: ResourceKey
): boolean =>
  prefix.length <= key.length &&
  prefix.every((part, index) => Object.is(part, key[index]));

export interface ResourceInvalidationRegistry {
  readonly invalidateResources: (options: {
    readonly queryKey: ResourceKey;
  }) => Promise<unknown>;
}

export const invalidateKey = (
  registry: ResourceInvalidationRegistry,
  queryKey: ResourceKey
) => registry.invalidateResources({ queryKey });

export const invalidateWorkspace = (
  registry: ResourceInvalidationRegistry,
  workspaceId: string
) => invalidateKey(registry, workspaceKeys.workspace(workspaceId));

export const invalidateWorkspaceResource = (
  registry: ResourceInvalidationRegistry,
  workspaceId: string,
  resource: string
) => invalidateKey(registry, workspaceKeys.resource(workspaceId, resource));
