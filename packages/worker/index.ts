import { providerRegistry } from '@delulu/api/providers';
import { database } from '@delulu/database';
import type { SocialPublishInputType } from '@delulu/validators/post';
import { nanoid } from 'nanoid';

async function processMessage(messageBody: string) {
  try {
    const { socialPublishInput, socialType } = JSON.parse(messageBody) as {
      socialPublishInput: SocialPublishInputType;
      socialType: 'LINKEDIN' | 'TWITTER' | 'TIKTOK';
    };

    console.log('Processing message:', socialPublishInput.postId);

    if (
      socialType === 'TWITTER' ||
      socialType === 'LINKEDIN' ||
      socialType === 'TIKTOK'
    ) {
      const providerImpl =
        providerRegistry[socialType as 'LINKEDIN' | 'TWITTER' | 'TIKTOK'];
      const result = await providerImpl.publish({
        content: socialPublishInput,
        socialProviderId: socialPublishInput.socialProviderId,
      });

      console.log('Result:', result);
      await database.post.update({
        where: {
          id: result.postId,
        },
        data: {
          status: 'PUBLISHED',
          platformPosts: {
            create: {
              platformPostId: result.platformPostId,
              platformId: result.platformId,
              platformPostUrl: result.platformPostUrl,
              id: `social_post_${nanoid(12)}`,
            },
          },
        },
      });
      console.log('Post posted:', result);
      return result;
    }

    throw new Error(`Unsupported socialType: ${socialType}`);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

// Get message from ECS environment variable
const messageBody = process.env.MESSAGE_BODY;
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
