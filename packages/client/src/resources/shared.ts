import type { ApiClient } from "../client.js";
import type { EffectRunner } from "../effect.js";
import { effectRunner } from "../effect.js";

export interface ResourceOptionsContext {
  readonly client: ApiClient;
  readonly runner?: EffectRunner;
}

export interface ResourceOptionsRuntime {
  readonly client: ApiClient;
  readonly runner: EffectRunner;
}

/** Extension seam used by each resource module, including future M3/M4 groups. */
export const defineResourceOptions =
  <T>(factory: (runtime: ResourceOptionsRuntime) => T) =>
  ({ client, runner = effectRunner }: ResourceOptionsContext): T =>
    factory({ client, runner });

export type EndpointRequest<Method> = Method extends (
  request: infer Request
) => unknown
  ? Omit<Request, "responseMode">
  : never;

export type EndpointPayload<Method> =
  EndpointRequest<Method> extends {
    readonly payload: infer Payload;
  }
    ? Payload
    : never;

export type EndpointQuery<Method> =
  EndpointRequest<Method> extends {
    readonly query: infer Query;
  }
    ? Query
    : never;
