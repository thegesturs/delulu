import { runEffectExit } from "@delulu/core/kernel/boundary";
import { Effect } from "effect";
import { getPublisher } from "./publish-registry";
import { ConvexClientLive } from "./services/convex";
import type {
  PostResult,
  PublishableSocialType,
  PublishContext,
} from "./types";

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
  const outcome = await runEffectExit(publisher.publish(ctx), {
    provide: (effect) => effect.pipe(Effect.provide(WorkerLayer)),
    mapFailure: (error) => ({
      message: error.message,
      retryable: error.retryable,
    }),
  });
  return outcome._tag === "Success"
    ? { status: "PUBLISHED", result: outcome.value }
    : { status: "FAILED", ...outcome.error };
};
