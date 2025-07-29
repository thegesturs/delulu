import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import type {
  SocialPublishInputType,
  SocialType,
} from '@delulu/validators/post';
import { providerRegistry } from './providers';

export async function processMessage(messageBody: string) {
  console.log('Message body', messageBody);
  const { socialPublishInput, socialType } = JSON.parse(messageBody) as {
    socialPublishInput: SocialPublishInputType;
    socialType: SocialType;
  };

  console.log('Social publish input', socialPublishInput);

  if (socialType === 'LENS' || socialType === 'DEFAULT') {
    return;
  }

  const providerImpl = providerRegistry[socialType];
  const result = await providerImpl.publish({
    content: socialPublishInput,
    socialProviderId: socialPublishInput.socialProviderId,
  });

  if (result.isErr()) {
    await convex.mutation(api.posts.updatePostPublishStatus, {
      postId: socialPublishInput.postId as Id<'posts'>,
      status: 'FAILED',
      platformPostData: {
        failureReason: result.error.message,
        socialProviderId:
          socialPublishInput.socialProviderId as Id<'socialProviders'>,
        postedAt: Date.now(),
        postId: socialPublishInput.postId as Id<'posts'>,
      },
    });
    return;
  }

  await convex.mutation(api.posts.updatePostPublishStatus, {
    postId: socialPublishInput.postId as Id<'posts'>,
    status: 'PUBLISHED',
    platformPostData: {
      platformPostId: result.value.platformPostId,
      socialProviderId:
        socialPublishInput.socialProviderId as Id<'socialProviders'>,
      platformPostUrl: result.value.platformPostUrl,
      postedAt: Date.now(),
      postId: socialPublishInput.postId as Id<'posts'>,
    },
  });
  return result;
}
