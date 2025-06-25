import { keys } from '@delulu/api/keys';
import { database as db, eq, socialProviders } from '@delulu/database';
import {
  type PostReturnType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { r2Provider } from './r2.provider';
import type { SocialProvider } from './types';

interface TikTokVideoUploadResponse {
  data: {
    publish_id: string;
  };
}

/**
 * Retrieves and refreshes if needed the access token and profile information for a TikTok account
 * @param socialProviderId - The ID of the social provider
 * @returns Promise containing the profile information and access token
 * @throws {TRPCError} - If the profile is not found or token refresh fails
 */
async function getAccessTokenAndProfile(socialProviderId: string) {
  const [profile] = await db.query.socialProviders.findMany({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'TikTok profile not found',
    });
  }

  // Check if we need to refresh the token
  if (
    profile.expiresIn &&
    profile.refreshToken &&
    profile.accessToken &&
    profile.expiresIn < new Date()
  ) {
    try {
      const response = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        new URLSearchParams({
          client_key: keys().TIKTOK_CLIENT_ID,
          client_secret: keys().TIKTOK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: profile.refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;
      if (data) {
        // Update the profile with new tokens
        const [updatedProfile] = await db
          .update(socialProviders)
          .set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token, // TikTok may return a new refresh token
            expiresIn: new Date(Date.now() + data.expires_in * 1000),
            lastSyncedAt: new Date(),
          })
          .where(eq(socialProviders.id, socialProviderId))
          .returning();
        return updatedProfile;
      }
    } catch (err) {
      console.error('Failed to refresh TikTok access token:', err);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh TikTok access token',
      });
    }
  }

  return profile;
}

export const tiktokProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    // Get the social provider profile with fresh access token
    const profile = await getAccessTokenAndProfile(socialProviderId);

    if (!profile.accessToken) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'TikTok profile not found or invalid access token',
      });
    }

    const firstContent = content.content[0];
    if (!firstContent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish',
      });
    }

    // Validate media
    const validMedia = getValidMediaUrls(firstContent.media);
    if (validMedia.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No valid media found. TikTok requires at least one video.',
      });
    }

    const videoMedia = validMedia.find((m) => m.mediaType === 'VIDEO');
    if (!videoMedia || !videoMedia.url) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'TikTok requires a video file.',
      });
    }

    if (!videoMedia.bucketKey) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No bucket key found for video media.',
      });
    }

    const fileUrl = await r2Provider.getSignedDownloadUrl(videoMedia.bucketKey);

    try {
      // Step 1: Query creator info
      const creatorInfoResponse = await axios
        .post(
          'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
          {},
          {
            headers: {
              Authorization: `Bearer ${profile.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .catch(async (error) => {
          // Check if error is due to expired token
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Try to refresh token and retry the request
            const refreshedProfile =
              await getAccessTokenAndProfile(socialProviderId);
            return axios.post(
              'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshedProfile.accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );
          }
          throw error;
        });

      // const creatorInfo = creatorInfoResponse.data.data;

      // Step 2: Initialize video upload
      const uploadResponse = await axios
        .post<TikTokVideoUploadResponse>(
          'https://open.tiktokapis.com/v2/post/publish/video/init/',
          {
            post_info: {
              title: firstContent.text || 'Video from Delulu',
              privacy_level: 'SELF_ONLY',
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: fileUrl,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${profile.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .catch(async (error) => {
          // Check if error is due to expired token
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Try to refresh token and retry the request
            const refreshedProfile =
              await getAccessTokenAndProfile(socialProviderId);
            return axios.post<TikTokVideoUploadResponse>(
              'https://open.tiktokapis.com/v2/post/publish/video/init/',
              {
                post_info: {
                  title: firstContent.text || 'Video from Delulu',
                  privacy_level: 'SELF_ONLY',
                  disable_duet: false,
                  disable_comment: false,
                  disable_stitch: false,
                },
                source_info: {
                  source: 'PULL_FROM_URL',
                  video_url: fileUrl,
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${refreshedProfile.accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );
          }
          throw error;
        });

      if (!uploadResponse.data.data?.publish_id) {
        throw new Error('Failed to get video upload ID');
      }

      const publishId = uploadResponse.data.data.publish_id;

      // Step 3: Wait for video processing to complete
      let maxAttempts = 30; // 30 attempts = 3 minutes total
      let status = '';
      let attempt = 0;
      let videoId = '';
      let currentProfile = profile;

      while (maxAttempts > 0) {
        attempt++;

        try {
          const statusResponse = await axios.post(
            'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
            {
              publish_id: publishId,
            },
            {
              headers: {
                Authorization: `Bearer ${currentProfile.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const statusData = statusResponse.data.data;
          status = statusData?.status;
          const postIds = statusData?.publicaly_available_post_id || [];
          videoId = postIds[0]?.toString();

          if (status === 'PUBLISH_COMPLETE') {
            return {
              postId: content.postId,
              platformPostId: videoId || publishId,
              platformId: currentProfile.id,
              platformPostUrl: videoId
                ? `https://www.tiktok.com/@${currentProfile.username}/video/${videoId}`
                : `https://www.tiktok.com/@${currentProfile.username}`,
              postedAt: new Date(),
            };
          }

          if (status === 'FAILED') {
            const failReason = statusData?.fail_reason;
            throw new Error(
              `Video processing failed: ${failReason || 'Unknown error'}`
            );
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Try to refresh token and update current profile
            currentProfile = await getAccessTokenAndProfile(socialProviderId);
            continue;
          }
          throw error;
        }

        // Continue polling if status is PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, or any other intermediate state
        await new Promise((resolve) => setTimeout(resolve, 6000));
        maxAttempts--;
      }

      throw new Error(
        'Video processing timed out after 3 minutes. Last status: ' + status
      );
    } catch (error) {
      console.error('Error posting to TikTok:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('TikTok API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to TikTok',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    // Generate a random state for CSRF protection
    const csrfState = nanoid();

    // Construct the TikTok OAuth URL with required parameters
    const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';
    const params = new URLSearchParams({
      client_key: keys().TIKTOK_CLIENT_ID,
      scope:
        'user.info.basic,video.publish,video.upload,user.info.profile,user.info.stats,video.list',
      response_type: 'code',
      redirect_uri: keys().TIKTOK_CALLBACK_URL,
      state: csrfState,
    });

    return `${baseUrl}?${params.toString()}`;
  },
};
