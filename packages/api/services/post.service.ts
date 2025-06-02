import type {
  SavePostInputType,
  SocialPublishInputType,
} from '@delulu/validators/post';
import { Queue } from 'bullmq';

export const createPostInQueue = async (post: SavePostInputType) => {
  for (const provider of post.socialProviders) {
    // Skip providers that are not implemented
    if (
      provider.socialType !== 'TWITTER' &&
      provider.socialType !== 'LINKEDIN'
    ) {
      continue;
    }

    // Find alternative content for this provider if it exists
    const alternativeContent = post.alternativeContent.find(
      (alt) => alt.socialProvider.socialId === provider.socialId
    );

    // Use alternative content if available, otherwise use default content
    const contentToPost = alternativeContent?.content ?? post.content;

    // // Get the provider implementation
    // const providerImpl = providerRegistry[provider.socialType];

    // Post the content using the provider's implementation
    // const result = await providerImpl.publish({
    //   content: {
    //     ...input,
    //     content: contentToPost,
    //   },
    //   socialProviderId: provider.socialId,
    // });

    const queue = new Queue('social-posts', {
      connection: { url: process.env.REDIS_URL! },
    });

    await queue.add('publish', {
      socialType: provider.socialType,
      socialPublishInput: {
        content: contentToPost,
        postId: post.id!,
        socialProviderId: provider.socialId,
      } as SocialPublishInputType,
    });
    console.log('Post added to queue:', {
      socialType: provider.socialType,
      socialProviderId: provider.socialId,
      content: contentToPost,
    });
  }
};
