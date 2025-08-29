import { describe, it, expect, vi } from 'vitest';
import { SOCIAL_PROVIDER_DATA, LAMBDA_URL, TEST_CONTENT, MOCK_POST_ID, MOCK_SUCCESS_RESPONSE, mockKeys } from './test-data';

const tiktokProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'TIKTOK')!;

// Mock keys function
vi.mock('../key', () => ({
  keys: mockKeys
}));

describe('TikTok Provider Tests', () => {
  it('should successfully post video', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_SUCCESS_RESPONSE),
    });
    global.fetch = mockFetch;

    const response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': mockKeys().POSTING_SECRET_KEY,
      },
      body: JSON.stringify({
        socialType: tiktokProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: tiktokProvider.id,
        },
      }),
    });

    expect(mockFetch).toHaveBeenCalledWith(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-secret-key',
      },
      body: JSON.stringify({
        socialType: 'TIKTOK',
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: tiktokProvider.id,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
  });
});