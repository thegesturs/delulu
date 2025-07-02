import { providerRegistry } from '@api/providers';
import { postQueries, PostStatus } from '@delulu/database';
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

    console.log('Content To Post:', contentToPost, provider.socialType);

    const providerImpl = providerRegistry[provider.socialType];
    const result = await providerImpl.publish({
      content: {
        content: contentToPost,
        postId: post.id!,
        socialProviderId: provider.socialId,
      },
      socialProviderId: provider.socialId,
    });

    await postQueries.createPlatformPost({
      postId: post.id!,
      platformId: provider.socialId,
      platformPostId: result.platformPostId,
      platformPostUrl: result.platformPostUrl,
    });

    await postQueries.updatePost(post.id!, {
      status: PostStatus.PUBLISHED,
    });

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
