import { describe, it, expect, beforeEach } from 'vitest';
import { SOCIAL_PROVIDER_DATA, TEST_CONTENT, MOCK_POST_ID } from './test-data';
import { processMessage } from '../client';

const linkedinProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'LINKEDIN')!;

describe('LinkedIn Provider Tests', () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it('should call processMessage for single image', async () => {
    const result = await processMessage(
      JSON.stringify({
        socialType: linkedinProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: linkedinProvider.id,
        },
      })
    );

    // Just verify it didn't crash and returned something
    expect(result).toBeDefined();
  });

  it('should call processMessage for multi-image', async () => {
    const result = await processMessage(
      JSON.stringify({
        socialType: linkedinProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: linkedinProvider.id,
        },
      })
    );

    // Just verify it didn't crash and returned something
    expect(result).toBeDefined();
  });

  it('should call processMessage for video', async () => {
    const result = await processMessage(
      JSON.stringify({
        socialType: linkedinProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: linkedinProvider.id,
        },
      })
    );

    // Just verify it didn't crash and returned something
    expect(result).toBeDefined();
  });
});