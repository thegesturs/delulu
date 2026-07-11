import type { Effect } from "effect";

/** The only runtime-specific input accepted by the shared API client. */
export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getToken: () => Promise<string>;
}

/** Stable workspace-aware key prefix shared by every consumer. */
export type WorkspaceQueryKey = readonly [
  "workspace",
  workspaceId: string,
  resource: string,
  ...parts: readonly unknown[],
];

/** Contract for the Effect-to-Promise bridge implemented by the client lane. */
export interface EffectRunner {
  readonly run: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>;
}

export const workspaceQueryKey = (
  workspaceId: string,
  resource: string,
  ...parts: readonly unknown[]
): WorkspaceQueryKey => ["workspace", workspaceId, resource, ...parts];
