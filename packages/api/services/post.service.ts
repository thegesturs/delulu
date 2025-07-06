import { type SavePostInputType, SocialTypes } from '@delulu/validators/post';
import axios from 'axios';

const LAMBDA_URL =
  'https://s6zm4w4r5xrwk5ejhdwcjiy7ry0rhvch.lambda-url.us-east-1.on.aws/';

export const createPostInQueue = async (post: SavePostInputType) => {
  for (const provider of post.socialProviders) {
    // Skip providers that are not implemented
    if (
      provider.socialType === SocialTypes.LENS ||
      provider.socialType === SocialTypes.DEFAULT
    ) {
      continue;
    }

    // Find alternative content for this provider if it exists
    const alternativeContent = post.alternativeContent.find(
      (alt) => alt.socialProvider.socialId === provider.socialId
    );

    // Use alternative content if available, otherwise use default content
    const contentToPost = alternativeContent?.content ?? post.content;

    // Fire and forget - just queue it
    axios.post(LAMBDA_URL, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.SECRET_KEY,
      },
      body: JSON.stringify({
        socialType: provider.socialType,
        socialPublishInput: {
          content: contentToPost,
          postId: post.id!,
          socialProviderId: provider.socialId,
        },
      }),
    });
  }
};
