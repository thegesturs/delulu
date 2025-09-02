import { beforeEach, describe, expect, it } from 'vitest';
import { processMessageTestOnly } from '../test-client';
import { MOCK_POST_ID, SOCIAL_PROVIDER_DATA, TEST_CONTENT } from './test-data';

const linkedinProvider = SOCIAL_PROVIDER_DATA.find(
  (p) => p.socialType === 'LINKEDIN'
)!;

describe('LinkedIn Provider Tests', () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it('should call processMessage for single image', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: linkedinProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: linkedinProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });

  it('should call processMessage for multi-image', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: linkedinProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: linkedinProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });

  it('should call processMessage for video', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: linkedinProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: linkedinProvider.id,
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });
});
