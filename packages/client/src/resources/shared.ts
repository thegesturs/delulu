import type { ApiClient } from "../client.js";

export interface ResourceEffectsContext {
  readonly client: ApiClient;
}

export interface ResourceEffectsRuntime {
  readonly client: ApiClient;
}

export const defineResourceEffects =
  <T>(factory: (runtime: ResourceEffectsRuntime) => T) =>
  ({ client }: ResourceEffectsContext): T =>
    factory({ client });

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
