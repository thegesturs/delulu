import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  parsePublishMode,
  shouldRouteThroughJobs,
  shouldRunLegacyWrite,
} from "@delulu/database/convex/schemas/publish";
import { convex } from "@delulu/database/node";
import type {
  SocialPublishInputType,
  SocialType,
} from "@delulu/validators/post";
import { providerRegistry } from "./providers";
import { classifyError } from "./providers/errors";
import { resolveMediaUrls } from "./resolve-media-urls";

interface PublishMessage {
  socialPublishInput: SocialPublishInputType;
  socialType: SocialType;
  // Publish Pipeline v2 — present once enqueue runs in dual/enabled mode.
  publishJobId?: string;
}

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

  const providerImpl = providerRegistry[socialType];
  const result = await providerImpl.publish({
    content: socialPublishInput,
    socialProviderId: socialPublishInput.socialProviderId,
  });

  if (result.isErr()) {
    const { errorCode, errorClass, errorMessage } = classifyError(result.error);

    if (useJobs && jobId) {
      await convex.mutation(api.publish.completeAttempt, {
        publishJobId: jobId,
        attemptNumber: attempt,
        status: "FAILED",
        errorCode,
        errorClass,
        errorMessage,
        workerRequestId: messageId,
        secret,
      });
    }

    if (useLegacy) {
      await convex.mutation(api.posts.updatePostPublishStatus, {
        postId: socialPublishInput.postId as Id<"posts">,
        status: "FAILED",
        platformPostData: {
          failureReason: errorMessage,
          socialProviderId:
            socialPublishInput.socialProviderId as Id<"socialProviders">,
          postedAt: Date.now(),
          postId: socialPublishInput.postId as Id<"posts">,
        },
        // In dual mode the job path owns side effects; legacy only mirrors.
        skipSideEffects: useJobs,
      });
    }

    // Re-throw transient errors so SQS redelivers and the job retries. Permanent
    // errors are terminal — returning lets SQS delete the message.
    if (useJobs && errorClass === "TRANSIENT") {
      throw result.error;
    }
    return;
  }

  if (useJobs && jobId) {
    await convex.mutation(api.publish.completeAttempt, {
      publishJobId: jobId,
      attemptNumber: attempt,
      status: "SUCCEEDED",
      platformPostId: result.value.platformPostId,
      platformPostUrl: result.value.platformPostUrl,
      workerRequestId: messageId,
      secret,
    });
  }

  if (useLegacy) {
    await convex.mutation(api.posts.updatePostPublishStatus, {
      postId: socialPublishInput.postId as Id<"posts">,
      status: "PUBLISHED",
      platformPostData: {
        platformPostId: result.value.platformPostId,
        socialProviderId:
          socialPublishInput.socialProviderId as Id<"socialProviders">,
        platformPostUrl: result.value.platformPostUrl,
        postedAt: Date.now(),
        postId: socialPublishInput.postId as Id<"posts">,
      },
      // In dual mode the job path owns side effects; legacy only mirrors.
      skipSideEffects: useJobs,
    });
  }

  return result;
}
