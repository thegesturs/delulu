import { Worker } from 'bullmq';
import { providerRegistry } from '../providers/index';
import { keys } from './keys';

const worker = new Worker(
  'social-posts',
  async (job) => {
    const { content, socialProviderId, socialType } = job.data;
    console.log('Processing job:', job.data);

    if (socialType === 'TWITTER' || socialType === 'LINKEDIN') {
      const providerImpl =
        providerRegistry[socialType as 'LINKEDIN' | 'TWITTER'];
      const result = await providerImpl.publish({
        content,
        socialProviderId,
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
