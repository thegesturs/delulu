import { keys } from '@api/keys';
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

    console.log(keys().POSTING_SECRET_KEY, 'header');

    // Fire and forget - just queue it
    const response = await axios.post(
      LAMBDA_URL,
      {
        socialType: provider.socialType,
        socialPublishInput: {
          content: contentToPost,
          postId: post.id!,
          socialProviderId: provider.socialId,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keys().POSTING_SECRET_KEY,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Failed to queue post: ${response.status} ${response.statusText}`
      );
    }

    console.log('Response', response);
  }
};
