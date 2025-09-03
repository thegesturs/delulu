import { describe, expect, it } from 'vitest';
import { processMessageTestOnly } from '../test-client';
import { MOCK_POST_ID, SOCIAL_PROVIDER_DATA, TEST_CONTENT } from './test-data';

const facebookProvider = SOCIAL_PROVIDER_DATA.find(
  (p) => p.socialType === 'FACEBOOK'
)!;

describe('Facebook Provider Tests', () => {
  it('should execute real Facebook provider with single image', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: facebookProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
        },
      })
    );

    // Real provider execution - result can be success or undefined on failure
    expect(result?.isOk?.() === true).toBe(true);
  });

  it('should call processMessage for carousel', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: facebookProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
        },
      })
    );

    // Real provider execution - result can be success or undefined on failure
    expect(result?.isOk?.() === true).toBe(true);
  });

  it('should call processMessage for video', async () => {
    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: facebookProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
        },
      })
    );

    // Real provider execution - result can be success or undefined on failure
    expect(result?.isOk?.() === true).toBe(true);
  });
});
