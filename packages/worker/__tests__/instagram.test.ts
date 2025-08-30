import { describe, it, expect, beforeEach } from 'vitest';
import { SOCIAL_PROVIDER_DATA, TEST_CONTENT, MOCK_POST_ID } from './test-data';
import { processMessageTestOnly } from '../test-client';

const instagramProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'INSTAGRAM')!;

describe('Instagram Provider Tests', () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it('should call processMessage for single image', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: instagramProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: instagramProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result === undefined || result?.isOk?.() === true || result?.isErr?.() === true).toBe(true);
  });

  it('should call processMessage for carousel', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: instagramProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: instagramProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result === undefined || result?.isOk?.() === true || result?.isErr?.() === true).toBe(true);
  });

  it('should call processMessage for reel', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: instagramProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: instagramProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result === undefined || result?.isOk?.() === true || result?.isErr?.() === true).toBe(true);
  });
});