import { describe, it, expect, beforeEach } from 'vitest';
import { SOCIAL_PROVIDER_DATA, TEST_CONTENT, MOCK_POST_ID } from './test-data';
import { processMessage } from '../client';

const youtubeProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'YOUTUBE')!;

describe('YouTube Provider Tests', () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it('should call processMessage for video', async () => {
    const result = await processMessage(
      JSON.stringify({
        socialType: youtubeProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: youtubeProvider.id,
        },
      })
    );

    // Just verify it didn't crash and returned something
    expect(result).toBeDefined();
  });
});