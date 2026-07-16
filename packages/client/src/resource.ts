import type { Effect } from "effect";

export type ResourceKey = readonly unknown[];

export interface ResourceEffect<A, E, Key extends ResourceKey = ResourceKey> {
  readonly queryKey: Key;
  readonly effect: () => Effect.Effect<A, E>;
}

export type ResourceEffectSuccess<Resource> =
  Resource extends ResourceEffect<infer A, infer _E, infer _Key> ? A : never;

export interface ResourceEffectInput<A, E, Key extends ResourceKey> {
  readonly queryKey: Key;
  readonly effect: () => Effect.Effect<A, E>;
}

export const resourceEffect = <A, E, Key extends ResourceKey>(
  input: ResourceEffectInput<A, E, Key>
): ResourceEffect<A, E, Key> => input;

export interface MutationEffect<A, E, Variables> {
  readonly mutationKey?: ResourceKey;
  readonly invalidates?: readonly ResourceKey[];
  readonly effect: (variables: Variables) => Effect.Effect<A, E>;
}

export interface MutationEffectInput<A, E, Variables> {
  readonly mutationKey?: ResourceKey;
  readonly invalidates?: readonly ResourceKey[];
  readonly effect: (variables: Variables) => Effect.Effect<A, E>;
}

export const mutationEffect = <A, E, Variables>(
  input: MutationEffectInput<A, E, Variables>
): MutationEffect<A, E, Variables> => input;
