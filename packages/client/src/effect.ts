import { Cause, Effect, Exit } from "effect";

export interface EffectRunner {
  readonly run: <A, E>(effect: Effect.Effect<A, E>) => Promise<A>;
}

const normalizeFailure = (failure: unknown): Error => {
  if (failure instanceof Error) {
    return failure;
  }
  return new Error(
    typeof failure === "string" ? failure : "Effect execution failed",
    { cause: failure }
  );
};

/**
 * Run an Effect at an imperative boundary without FiberFailure wrapping.
 * Declared TaggedErrorClass failures are already Error instances and are
 * therefore rejected unchanged; defects and non-Error failures are normalized.
 */
export const runEffect = async <A, E>(
  effect: Effect.Effect<A, E>
): Promise<A> => {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }
  throw normalizeFailure(Cause.squash(exit.cause));
};

export const effectRunner: EffectRunner = { run: runEffect };
