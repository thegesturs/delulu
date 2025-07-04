import { providerRegistry } from '@api/providers';
import { postQueries } from '@delulu/database';
import { type SavePostInputType, SocialTypes } from '@delulu/validators/post';

// import { Queue } from 'bullmq';

export const createPostInQueue = async (post: SavePostInputType) => {
  //   console.log('Post:', post.socialProviders);
  for (const provider of post.socialProviders) {
    console.log('Provider:', provider);

    // Skip providers that are not implemented
    if (
      provider.socialType === SocialTypes.LENS ||
      provider.socialType === SocialTypes.DEFAULT
      //   provider.socialType === SocialTypes.FACEBOOK
    ) {
      continue;
    }

    console.log('Provider:', provider);

    // Find alternative content for this provider if it exists
    const alternativeContent = post.alternativeContent.find(
      (alt) => alt.socialProvider.socialId === provider.socialId
    );

    // Use alternative content if available, otherwise use default content
    const contentToPost = alternativeContent?.content ?? post.content;

    const providerImpl = providerRegistry[provider.socialType];
    const result = await providerImpl.publish({
      content: {
        content: contentToPost,
        postId: post.id!,
        socialProviderId: provider.socialId,
      },
      socialProviderId: provider.socialId,
    });

    if (result.isErr()) {
      await postQueries.postPublishedOrFailed({
        postId: post.id!,
        platformPostData: {
          postId: post.id!,
          socialProviderId: provider.socialId,
          failureReason: result.error.message,
        },
        status: 'FAILED',
      });
    }

    if (result.isOk()) {
      await postQueries.postPublishedOrFailed({
        postId: post.id!,
        platformPostData: {
          postId: post.id!,
          socialProviderId: provider.socialId,
          platformPostId: result.value.platformPostId,
          platformPostUrl: result.value.platformPostUrl,
          postedAt: result.value.postedAt,
        },
        status: 'PUBLISHED',
      });
    }

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

    // const queue = new Queue('social-posts', {
    //   connection: { url: process.env.REDIS_URL! },
    // });

    // await queue.add('publish', {
    //   socialType: provider.socialType,
    //   socialPublishInput: {
    //     content: contentToPost,
    //     postId: post.id!,
    //     socialProviderId: provider.socialId,
    //   } as SocialPublishInputType,
    // });
    console.log('Post added to queue:', {
      socialType: provider.socialType,
      socialProviderId: provider.socialId,
      content: contentToPost,
    });
  }
};
