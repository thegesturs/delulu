import { runEffectExit } from "@delulu/core/kernel/boundary";
import { Effect, type Layer } from "effect";
import { getPublisher } from "./publish-registry";
import type { ConnectionStore } from "./services/connection-store";
import type {
  PostResult,
  PublishableSocialType,
  PublishContext,
} from "./types";

export type PublishOutcome =
  | { status: "PUBLISHED"; result: PostResult }
  | { status: "CONTINUE"; resumeAt: number }
  | { status: "FAILED"; message: string; retryable: boolean };

/**
 * The single publish boundary for the worker. Runs the publish Effect, provides
 * the connection store, and collapses success/typed-failure/defect into a flat
 * outcome the durable executor can act on.
 */
export const runPublish = async (
  id: PublishableSocialType,
  ctx: PublishContext,
  connectionStore: Layer.Layer<ConnectionStore>
): Promise<PublishOutcome> => {
  const publisher = getPublisher(id);
  const outcome = await runEffectExit(
    publisher.publish(ctx).pipe(
      Effect.map((result): PublishOutcome => ({ status: "PUBLISHED", result })),
      Effect.catchTag("PublishContinuation", (error) =>
        Effect.succeed<PublishOutcome>({
          status: "CONTINUE",
          resumeAt: error.resumeAt,
        })
      )
    ),
    {
      provide: (effect) => effect.pipe(Effect.provide(connectionStore)),
      mapFailure: (error) => ({
        message: error.message,
        retryable: error.retryable,
      }),
    }
  );
  return outcome._tag === "Success"
    ? outcome.value
    : { status: "FAILED", ...outcome.error };
};
