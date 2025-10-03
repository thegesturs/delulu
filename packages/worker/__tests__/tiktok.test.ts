import { beforeEach, describe, expect, it } from 'vitest';
import { processMessageTestOnly } from '../test-client';
import { MOCK_POST_ID, SOCIAL_PROVIDER_DATA, TEST_CONTENT } from './test-data';

const tiktokProvider = SOCIAL_PROVIDER_DATA.find(
  (p) => p.socialType === 'TIKTOK'
)!;

describe('TikTok Provider Tests', () => {
  beforeEach(() => {
    // Clear any state if needed
  });

  it('should call processMessage for video with TikTok settings', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: tiktokProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: tiktokProvider.id,
          providerSettings: {
            socialProviderId: tiktokProvider.id,
            type: 'TIKTOK',
            settings: {
              privacy: 'SELF_ONLY',
              allowComments: true,
              allowDuet: true,
              allowStitch: true,
              promotionContent: 'NONE',
            },
          },
        },
      })
    );

    // Just verify it didn't crash - result can be undefined if provider fails
    expect(result?.isOk?.() === true).toBe(true);
  });
});
