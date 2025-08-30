import { describe, it, expect, beforeEach } from 'vitest';
import { SOCIAL_PROVIDER_DATA, TEST_CONTENT, MOCK_POST_ID } from './test-data';
import { processMessage } from '../client';

const tiktokProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'TIKTOK')!;

describe('TikTok Provider Tests', () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it('should call processMessage for video', async () => {
    const result = await processMessage(
      JSON.stringify({
        socialType: tiktokProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: tiktokProvider.id,
        },
      })
    );

    // Just verify it didn't crash and returned something
    expect(result).toBeDefined();
  });
});