import { Cause, Effect, Exit, Option } from "effect";
import { ConnectionError } from "./errors";
import { getPublisher } from "./publish-registry";
import { ConvexClientLive } from "./services/convex";
import type { PostResult, PublishContext, PublishableSocialType } from "./types";

/** Everything the worker Lambda needs to run a publish Effect. */
export const WorkerLayer = ConvexClientLive;

export type PublishOutcome =
  | { status: "PUBLISHED"; result: PostResult }
  | { status: "FAILED"; message: string; retryable: boolean };

/**
 * The single publish boundary for the worker. Runs the publish Effect, provides
 * the live Convex layer, and collapses success/typed-failure/defect into a flat
 * outcome the SQS handler can act on. Replaces the old `result.isErr()` branch
 * in `worker/client.ts`.
 */
export const runPublish = async (
  id: PublishableSocialType,
  ctx: PublishContext
): Promise<PublishOutcome> => {
  const publisher = getPublisher(id);
  const exit = await Effect.runPromiseExit(
    publisher.publish(ctx).pipe(Effect.provide(WorkerLayer))
  );

  return Exit.match(exit, {
    onSuccess: (result) => ({ status: "PUBLISHED" as const, result }),
    onFailure: (cause) => {
      const failure = Cause.failureOption(cause);
      if (Option.isSome(failure) && failure.value instanceof ConnectionError) {
        return {
          status: "FAILED" as const,
          message: failure.value.message,
          retryable: failure.value.retryable,
        };
      }
      // Unexpected defect (bug, non-ConnectionError throw) — do not retry.
      const squashed = Cause.squash(cause);
      return {
        status: "FAILED" as const,
        message: squashed instanceof Error ? squashed.message : "Unknown publish error",
        retryable: false,
      };
    },
  });
};
