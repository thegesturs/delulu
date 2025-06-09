import { database } from '@delulu/database';
import type { SocialPublishInputType } from '@delulu/validators/post';
import { Worker } from 'bullmq';
import { nanoid } from 'nanoid';
import { providerRegistry } from '../providers/index';
import { keys } from './keys';

const worker = new Worker(
  'social-posts',
  async (job) => {
    const { socialPublishInput, socialType } = job.data as {
      socialPublishInput: SocialPublishInputType;
      socialType: 'LINKEDIN' | 'TWITTER';
    };
    console.log('Processing job:', socialPublishInput.postId);

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
  },
  {
    connection: {
      url: keys().REDIS_URL,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
