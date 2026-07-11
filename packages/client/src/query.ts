import type {
  MutationKey,
  MutationOptions,
  QueryKey,
  QueryOptions,
} from "@tanstack/react-query";
import type { Effect } from "effect";
import { type EffectRunner, effectRunner } from "./effect.js";

export interface EffectQueryInput<A, E, Key extends QueryKey> {
  readonly queryKey: Key;
  readonly effect: () => Effect.Effect<A, E>;
  readonly runner?: EffectRunner;
}

export const effectQuery = <A, E, Key extends QueryKey>({
  queryKey,
  effect,
  runner = effectRunner,
}: EffectQueryInput<A, E, Key>): QueryOptions<A, Error, A, Key> => ({
  queryKey,
  queryFn: () => runner.run(effect()),
});

export interface EffectMutationInput<A, E, Variables, Context = unknown> {
  readonly mutationKey?: MutationKey;
  readonly effect: (variables: Variables) => Effect.Effect<A, E>;
  readonly runner?: EffectRunner;
  readonly onSuccess?: MutationOptions<
    A,
    Error,
    Variables,
    Context
  >["onSuccess"];
}

export const effectMutation = <A, E, Variables, Context = unknown>({
  mutationKey,
  effect,
  runner = effectRunner,
  onSuccess,
}: EffectMutationInput<A, E, Variables, Context>): MutationOptions<
  A,
  Error,
  Variables,
  Context
> => ({
  ...(mutationKey ? { mutationKey } : {}),
  mutationFn: (variables) => runner.run(effect(variables)),
  ...(onSuccess ? { onSuccess } : {}),
});
