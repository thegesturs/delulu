import { keys } from "@api/keys";
import type { GetPostByIdSchema } from "@delulu/database/convex/schemas";
import { SocialTypes } from "@delulu/validators/post";

// import { processMessage } from '@delulu/worker/client';

const LAMBDA_URL =
  "https://s6zm4w4r5xrwk5ejhdwcjiy7ry0rhvch.lambda-url.us-east-1.on.aws/";

export const createPostInQueue = async (post: GetPostByIdSchema) => {
  console.log("[PostService] createPostInQueue called with post:", {
    postId: post._id,
    hasProviderSettings: !!post.providerSettings,
    providerSettingsLength: post.providerSettings?.length,
    providerSettings: post.providerSettings,
  });

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
