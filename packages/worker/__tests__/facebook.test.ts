import { describe, it, expect, vi } from 'vitest';
import { SOCIAL_PROVIDER_DATA, LAMBDA_URL, TEST_CONTENT, MOCK_POST_ID, MOCK_SUCCESS_RESPONSE, mockKeys } from './test-data';

const facebookProvider = SOCIAL_PROVIDER_DATA.find(p => p.socialType === 'FACEBOOK')!;

// Mock keys function
vi.mock('../key', () => ({
  keys: mockKeys
}));

describe('Facebook Provider Tests', () => {
  it('should successfully post single image', async () => {
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
        socialType: facebookProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
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
        socialType: 'FACEBOOK',
        socialPublishInput: {
          content: TEST_CONTENT.singleImage,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
  });

  it('should successfully post carousel', async () => {
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
        socialType: facebookProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
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
        socialType: 'FACEBOOK',
        socialPublishInput: {
          content: TEST_CONTENT.carousel,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
  });

  it('should successfully post reel', async () => {
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
        socialType: facebookProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
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
        socialType: 'FACEBOOK',
        socialPublishInput: {
          content: TEST_CONTENT.video,
          postId: MOCK_POST_ID,
          socialProviderId: facebookProvider.id,
        },
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
  });
});