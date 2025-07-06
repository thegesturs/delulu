import { providerRegistry } from '@delulu/api/providers';
import { type SocialType, postQueries } from '@delulu/database';
import type { SocialPublishInputType } from '@delulu/validators/post';

async function processMessage(messageBody: string) {
  console.log('Message body', messageBody);
  const { socialPublishInput, socialType } = JSON.parse(messageBody) as {
    socialPublishInput: SocialPublishInputType;
    socialType: SocialType;
  };

  console.log('Social publish input', socialPublishInput);

  if (socialType === 'LENS') {
    return;
  }

  const providerImpl = providerRegistry[socialType];
  const result = await providerImpl.publish({
    content: socialPublishInput,
    socialProviderId: socialPublishInput.socialProviderId,
  });

  if (result.isErr()) {
    await postQueries.postPublishedOrFailed({
      postId: socialPublishInput.postId,
      platformPostData: {
        failureReason: result.error.message,
        socialProviderId: socialPublishInput.socialProviderId,
        postedAt: new Date(),
        postId: socialPublishInput.postId,
      },
      status: 'FAILED',
    });
    return;
  }

  await postQueries.postPublishedOrFailed({
    postId: socialPublishInput.postId,
    platformPostData: {
      platformPostId: result.value.platformPostId,
      socialProviderId: result.value.platformId,
      platformPostUrl: result.value.platformPostUrl,
      postedAt: new Date(),
      postId: socialPublishInput.postId,
    },
    status: 'PUBLISHED',
  });
  return result;
}

// Get message from ECS environment variable
const messageBody = process.env.MESSAGE_BODY;

console.log('Message body', messageBody);

if (!messageBody) {
  throw new Error('No MESSAGE_BODY environment variable provided');
}

// Process the message and exit
processMessage(messageBody)
  .then(() => {
    console.log('Message processed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to process message:', error);
    process.exit(1);
  });
