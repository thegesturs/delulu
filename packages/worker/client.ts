import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { convex } from "@delulu/database/node";
import { runPublish } from "@delulu/integrations/worker";
import type {
  SocialPublishInputType,
  SocialType,
} from "@delulu/validators/post";
import { resolveMediaUrls } from "./resolve-media-urls";

type UpdateArgs = {
  postId: Id<"posts">;
  status: "PUBLISHED" | "FAILED";
  platformPostData: {
    platformPostId?: string;
    platformPostUrl?: string;
    failureReason?: string;
    socialProviderId: Id<"socialProviders">;
    postedAt: number;
    postId: Id<"posts">;
  };
};

const markFailed = (input: SocialPublishInputType, failureReason: string) =>
  convex.mutation(api.posts.updatePostPublishStatus, {
    postId: input.postId as Id<"posts">,
    status: "FAILED",
    platformPostData: {
      failureReason,
      socialProviderId: input.socialProviderId as Id<"socialProviders">,
      postedAt: Date.now(),
      postId: input.postId as Id<"posts">,
    },
  } satisfies UpdateArgs);

const markPublished = (
  input: SocialPublishInputType,
  data: { platformPostId: string; platformPostUrl: string }
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
  } satisfies UpdateArgs);

export async function processMessage(messageBody: string) {
  console.log("Message body", messageBody);
  const { socialPublishInput, socialType } = JSON.parse(messageBody) as {
    socialPublishInput: SocialPublishInputType;
    socialType: SocialType;
  };

  console.log("Social publish input", socialPublishInput);

  if (socialType === "LENS" || socialType === "DEFAULT") {
    return;
  }

  await resolveMediaUrls(socialPublishInput);

  // All platforms publish through @delulu/integrations (Effect). The boundary
  // returns a flat outcome; retryable failures rethrow so SQS re-delivers.
  const outcome = await runPublish(socialType, {
    content: socialPublishInput,
    socialProviderId: socialPublishInput.socialProviderId,
  });

  if (outcome.status === "FAILED") {
    await markFailed(socialPublishInput, outcome.message);
    if (outcome.retryable) {
      throw new Error(`Retryable publish failure: ${outcome.message}`);
    }
    return;
  }

  await markPublished(socialPublishInput, {
    platformPostId: outcome.result.platformPostId,
    platformPostUrl: outcome.result.platformPostUrl,
  });
}
