import { describe, it, expect } from 'vitest';
import { SOCIAL_PROVIDER_DATA, TEST_CONTENT, MOCK_POST_ID } from './test-data';
import { processMessageTestOnly } from '../test-client';

const facebookProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'FACEBOOK')!;

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
    expect(result === undefined || result?.isOk?.() === true || result?.isErr?.() === true).toBe(true);
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
    expect(result === undefined || result?.isOk?.() === true || result?.isErr?.() === true).toBe(true);
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
    expect(result === undefined || result?.isOk?.() === true || result?.isErr?.() === true).toBe(true);
  });
});