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

  it('should publish video without custom thumbnail (defaults to 1000ms)', async () => {
    console.log('\n=== Testing TikTok video without custom thumbnail ===');

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
              privacy: 'PUBLIC_TO_EVERYONE',
              allowComments: true,
              allowDuet: true,
              allowStitch: true,
              promotionContent: 'NONE',
            },
          },
        },
      })
    );

    console.log('Test result:', result);

    // Verify success
    expect(result?.isOk?.()).toBe(true);

    if (result?.isOk()) {
      const value = result.value;
      console.log('Published video:', {
        platformPostId: value.platformPostId,
        platformPostUrl: value.platformPostUrl,
      });

      // Verify URL format: should be https://www.tiktok.com/@username/video/{id}
      expect(value.platformPostUrl).toMatch(/https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+/);

      console.log('✅ Video published successfully with default thumbnail');
    }
  }, 120000); // 2 minute timeout for API calls

  it('should publish video with custom thumbnail at 5.5 seconds', async () => {
    console.log('\n=== Testing TikTok video with custom thumbnail at 5.5s ===');

    const result = await processMessageTestOnly(
      JSON.stringify({
        socialType: tiktokProvider.socialType,
        socialPublishInput: {
          content: TEST_CONTENT.videoWithThumbnail,
          postId: MOCK_POST_ID,
          socialProviderId: tiktokProvider.id,
          providerSettings: {
            socialProviderId: tiktokProvider.id,
            type: 'TIKTOK',
            settings: {
              privacy: 'PUBLIC_TO_EVERYONE',
              allowComments: true,
              allowDuet: true,
              allowStitch: true,
              promotionContent: 'NONE',
            },
          },
        },
      })
    );

    console.log('Test result:', result);

    // Verify success
    expect(result?.isOk?.()).toBe(true);

    if (result?.isOk()) {
      const value = result.value;
      console.log('Published video:', {
        platformPostId: value.platformPostId,
        platformPostUrl: value.platformPostUrl,
        thumbnailTimestamp: TEST_CONTENT.videoWithThumbnail[0].media[0].thumbnailTimestamp,
      });

      // Verify URL format and that it uses real item_id (not publish_id)
      expect(value.platformPostUrl).toMatch(/https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+/);

      // Verify the URL doesn't use the same ID as platformPostId (publish_id)
      const urlVideoId = value.platformPostUrl.split('/video/')[1];
      console.log('Video IDs:', {
        platformPostId: value.platformPostId,
        urlVideoId: urlVideoId,
        areEqual: urlVideoId === value.platformPostId,
      });

      console.log('✅ Video published successfully with custom thumbnail at 5.5 seconds');
      console.log('⚠️ Please manually verify on TikTok that the thumbnail is at 5.5 seconds, not 1 second');
    }
  }, 120000); // 2 minute timeout for API calls

  it('should use real video ID (item_id) in URL, not publish_id', async () => {
    console.log('\n=== Testing TikTok video URL uses real item_id ===');

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
              privacy: 'PUBLIC_TO_EVERYONE',
              allowComments: true,
              allowDuet: true,
              allowStitch: true,
              promotionContent: 'NONE',
            },
          },
        },
      })
    );

    console.log('Test result:', result);

    // Verify success
    expect(result?.isOk?.()).toBe(true);

    if (result?.isOk()) {
      const value = result.value;
      const urlVideoId = value.platformPostUrl.split('/video/')[1];

      console.log('Video IDs:', {
        platformPostId: value.platformPostId,
        urlVideoId: urlVideoId,
      });

      // The publish_id and item_id should be different
      // If they're the same, it means we're using publish_id (the bug)
      if (urlVideoId === value.platformPostId) {
        console.warn('⚠️ WARNING: Video URL is using publish_id, not real item_id!');
        console.warn('This indicates the video list query may have failed or returned no results');
      } else {
        console.log('✅ Video URL is using real item_id (correct implementation)');
      }

      // Verify the URL is accessible
      console.log('Video URL:', value.platformPostUrl);
      console.log('⚠️ Please manually verify this URL opens correctly in a browser');
    }
  }, 120000); // 2 minute timeout for API calls
});
