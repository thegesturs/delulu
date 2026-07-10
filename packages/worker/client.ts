import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  parsePublishMode,
  shouldRouteThroughJobs,
  shouldRunLegacyWrite,
} from "@delulu/database/convex/schemas/publish";
import { convex } from "@delulu/database/node";
import { runPublish } from "@delulu/connections/worker";
import type {
  SocialPublishInputType,
  SocialType,
} from "@delulu/validators/post";
import { resolveMediaUrls } from "./resolve-media-urls";

interface PublishMessage {
  socialPublishInput: SocialPublishInputType;
  socialType: SocialType;
  // Publish Pipeline v2 — present once enqueue runs in dual/enabled mode.
  publishJobId?: string;
}

const markFailed = (
  input: SocialPublishInputType,
  failureReason: string,
  skipSideEffects: boolean
) =>
  convex.mutation(api.posts.updatePostPublishStatus, {
    postId: input.postId as Id<"posts">,
    status: "FAILED",
    platformPostData: {
      failureReason,
      socialProviderId: input.socialProviderId as Id<"socialProviders">,
      postedAt: Date.now(),
      postId: input.postId as Id<"posts">,
    },
    // In dual mode the job path owns side effects; legacy only mirrors.
    skipSideEffects,
  });

const markPublished = (
  input: SocialPublishInputType,
  data: { platformPostId: string; platformPostUrl: string },
  skipSideEffects: boolean
) =>
  convex.mutation(api.posts.updatePostPublishStatus, {
    postId: input.postId as Id<"posts">,
    status: "PUBLISHED",
    platformPostData: {
      platformPostId: data.platformPostId,
      platformPostUrl: data.platformPostUrl,
      socialProviderId: input.socialProviderId as Id<"socialProviders">,
      postedAt: Date.now(),
      postId: input.postId as Id<"posts">,
    },
    // In dual mode the job path owns side effects; legacy only mirrors.
    skipSideEffects,
  });

export async function processMessage(
  messageBody: string,
  messageId?: string,
  // SQS ApproximateReceiveCount — 1 on first delivery, 2+ on each redelivery.
  receiveCount?: number
) {
  console.log("Message body", messageBody);
  const { socialPublishInput, socialType, publishJobId } = JSON.parse(
    messageBody
  ) as PublishMessage;

  console.log("Social publish input", socialPublishInput);

  if (socialType === "LENS" || socialType === "DEFAULT") {
    return;
  }

  const mode = parsePublishMode(process.env.PUBLISH_PIPELINE_V2);
  // Only drive the job pipeline when this message actually carries a job id.
  const useJobs = Boolean(publishJobId) && shouldRouteThroughJobs(mode);
  const useLegacy = !useJobs || shouldRunLegacyWrite(mode);
  // Attempt number tracks SQS redeliveries so each retry appends a new
  // publish_attempts row instead of overwriting attempt 1.
  const attempt = receiveCount ?? 1;
  const jobId = publishJobId as Id<"publish_jobs"> | undefined;
  const secret = process.env.PUBLISH_PIPELINE_SECRET;

  if (useJobs && jobId) {
    await convex.mutation(api.publish.startAttempt, {
      publishJobId: jobId,
      attemptNumber: attempt,
      workerRequestId: messageId,
      secret,
    });
  }

  await resolveMediaUrls(socialPublishInput);

  // All platforms publish through @delulu/connections (Effect). The boundary
  // returns a flat outcome; `retryable` maps to the job error class.
  const outcome = await runPublish(socialType, {
    content: socialPublishInput,
    socialProviderId: socialPublishInput.socialProviderId,
  });

  if (outcome.status === "FAILED") {
    const errorClass = outcome.retryable ? "TRANSIENT" : "PERMANENT";

    if (useJobs && jobId) {
      await convex.mutation(api.publish.completeAttempt, {
        publishJobId: jobId,
        attemptNumber: attempt,
        status: "FAILED",
        errorCode: outcome.code,
        errorClass,
        errorMessage: outcome.message,
        workerRequestId: messageId,
        secret,
      });
    }

    if (useLegacy) {
      await markFailed(socialPublishInput, outcome.message, useJobs);
    }

    // Re-throw retryable failures so SQS redelivers (and the job retries).
    // Permanent errors are terminal — returning lets SQS delete the message.
    if (outcome.retryable) {
      throw new Error(`Retryable publish failure: ${outcome.message}`);
    }
    return;
  }

  if (useJobs && jobId) {
    await convex.mutation(api.publish.completeAttempt, {
      publishJobId: jobId,
      attemptNumber: attempt,
      status: "SUCCEEDED",
      platformPostId: outcome.result.platformPostId,
      platformPostUrl: outcome.result.platformPostUrl,
      workerRequestId: messageId,
      secret,
    });
  }

  if (useLegacy) {
    await markPublished(
      socialPublishInput,
      {
        platformPostId: outcome.result.platformPostId,
        platformPostUrl: outcome.result.platformPostUrl,
      },
      useJobs
    );
  }
}
