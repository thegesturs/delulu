import { keys } from "@api/keys";
import { api } from "@delulu/database/convex/_generated/api";
import type { GetPostByIdSchema } from "@delulu/database/convex/schemas";
import {
  parsePublishMode,
  shouldCreateJobs,
  shouldRouteThroughJobs,
} from "@delulu/database/convex/schemas/publish";
import { fetchMutation } from "@delulu/database/server";
import { SocialTypes } from "@delulu/validators/post";

// import { processMessage } from '@delulu/worker/client';

// ponytail: env-first, hardcoded fallback keeps existing behavior if unset.
const LAMBDA_URL =
  process.env.POSTING_LAMBDA_URL ??
  "https://xikjne7ewghcn3eeeiat6fklxi0wpqbd.lambda-url.us-east-1.on.aws/";

export const createPostInQueue = async (post: GetPostByIdSchema) => {
  console.log("[PostService] createPostInQueue called with post:", {
    postId: post._id,
    hasProviderSettings: !!post.providerSettings,
    providerSettingsLength: post.providerSettings?.length,
    providerSettings: post.providerSettings,
  });

  // Publish Pipeline v2 — create a job run (shadow+) and thread each job id into
  // its SQS message (dual+). Off by default; controlled by PUBLISH_PIPELINE_V2.
  const publishMode = parsePublishMode(process.env.PUBLISH_PIPELINE_V2);
  const routeThroughJobs = shouldRouteThroughJobs(publishMode);
  let jobByProvider: Record<string, string> = {};
  if (shouldCreateJobs(publishMode)) {
    const run = await fetchMutation(api.publish.createPublishRun, {
      postId: post._id,
    });
    jobByProvider = Object.fromEntries(
      run.jobs.map((j) => [j.socialProviderId, j.publishJobId])
    );
  }

  for (const provider of post.socialProviders) {
    // Skip providers that are not implemented
    if (provider.socialType === SocialTypes.LENS) {
      continue;
    }

    // Find alternative content for this provider if it exists
    const alternativeContent = post.alternativeContent.find(
      (alt) => alt.socialProvider._id === provider._id
    );

    // Use alternative content if available, otherwise use default content
    const contentToPost = alternativeContent?.content ?? post.content;

    // Debug: Check if providerSettings exists
    console.log("[PostService] Post providerSettings:", post.providerSettings);
    console.log("[PostService] Provider ID:", provider._id);

    // Find provider-specific settings for this provider
    const providerSettings = post.providerSettings?.find(
      (setting) => setting.socialProviderId === provider._id
    );

    console.log("[PostService] Found settings for provider:", providerSettings);

    // Fire and forget - just queue it
    const response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": keys().POSTING_SECRET_KEY,
      },
      body: JSON.stringify({
        socialType: provider.socialType,
        ...(routeThroughJobs && jobByProvider[provider._id]
          ? { publishJobId: jobByProvider[provider._id], attemptNumber: 1 }
          : {}),
        socialPublishInput: {
          content: contentToPost,
          postId: post._id,
          socialProviderId: provider._id,
          // Include provider-specific settings if available
          ...(providerSettings && { providerSettings }),
        },
      }),
    });

    // const result = await processMessage(
    //   JSON.stringify({
    //     socialType: provider.socialType,
    //     socialPublishInput: {
    //       content: contentToPost,
    //       postId: post._id,
    //       socialProviderId: provider._id,
    //     },
    //   })
    // );

    // console.log('Result', res);

    if (!response.ok) {
      throw new Error(
        `Failed to queue post: ${response.status} ${response.statusText}`
      );
    }

    console.log("Response", response);
  }
};
