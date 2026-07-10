import { Cause, Effect, Exit, Option } from "effect";

export interface BoundaryFailure {
  readonly message: string;
  readonly retryable: boolean;
}

export const runEffectExit = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options: {
    readonly provide: (effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E>;
    readonly mapFailure: (error: E) => BoundaryFailure;
    readonly mapDefect?: (cause: unknown) => BoundaryFailure;
  }
): Promise<
  | { readonly _tag: "Success"; readonly value: A }
  | { readonly _tag: "Failure"; readonly error: BoundaryFailure }
> =>
  Effect.runPromiseExit(options.provide(effect)).then((exit) =>
    Exit.match(exit, {
      onSuccess: (value) => ({ _tag: "Success" as const, value }),
      onFailure: (cause) => {
        const failure = Cause.findErrorOption(cause);
        if (Option.isSome(failure)) {
          return {
            _tag: "Failure" as const,
            error: options.mapFailure(failure.value),
          };
        }
        const defect = Cause.squash(cause);
        return {
          _tag: "Failure" as const,
          error: options.mapDefect?.(defect) ?? {
            message:
              defect instanceof Error
                ? defect.message
                : "Unexpected runtime defect",
            retryable: false,
          },
        };
      },
    })
  );
