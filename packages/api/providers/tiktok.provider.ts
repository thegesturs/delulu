import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
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

interface TikTokVideoCreateResponse {
  data: {
    share_id: string;
    video_id: string;
  };
}

export const tiktokProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    // Get the social provider profile
    const profile = await database.socialProvider.findUnique({
      where: {
        id: socialProviderId,
      },
    });

    if (!profile || !profile.accessToken) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'TikTok profile not found',
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
    console.log('fileUrl', fileUrl);

    try {
      // Step 1: Query creator info
      const creatorInfoResponse = await axios.post(
        'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
        {},
        {
          headers: {
            Authorization: `Bearer ${profile.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const creatorInfo = creatorInfoResponse.data.data;
      console.log('Creator info:', creatorInfo);

      // Step 2: Initialize video upload
      const uploadResponse = await axios.post<TikTokVideoUploadResponse>(
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
      );

      if (!uploadResponse.data.data?.publish_id) {
        throw new Error('Failed to get video upload ID');
      }

      const publishId = uploadResponse.data.data.publish_id;
      console.log('TikTok upload initialized with publish_id:', publishId);

      // Step 3: Wait for video processing to complete
      let maxAttempts = 30; // 30 attempts = 3 minutes total
      let status = '';
      let attempt = 0;
      let videoId = '';

      while (maxAttempts > 0) {
        attempt++;
        console.log(
          `Checking TikTok upload status (attempt ${attempt}/${30})...`
        );

        const statusResponse = await axios.post(
          'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
          {
            publish_id: publishId,
          },
          {
            headers: {
              Authorization: `Bearer ${profile.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Status response:', statusResponse.data);

        const statusData = statusResponse.data.data;
        status = statusData?.status;
        const postIds = statusData?.publicaly_available_post_id || [];
        videoId = postIds[0]?.toString();

        console.log('TikTok upload status details:', {
          status,
          attempt,
          publishId,
          videoId,
          postIds,
          ...statusData,
        });

        if (status === 'PUBLISH_COMPLETE') {
          console.log(
            'TikTok upload completed successfully with status:',
            status
          );

          return {
            postId: content.postId,
            platformPostId: videoId || publishId,
            platformId: profile.id,
            platformPostUrl: videoId
              ? `https://www.tiktok.com/@${profile.username}/video/${videoId}`
              : `https://www.tiktok.com/@${profile.username}`,
            postedAt: new Date(),
          };
        }

        if (status === 'FAILED') {
          const failReason = statusData?.fail_reason;
          console.error('TikTok upload failed:', {
            status,
            failReason,
            response: statusResponse.data,
          });
          throw new Error(
            `Video processing failed: ${failReason || 'Unknown error'}`
          );
        }

        // Continue polling if status is PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, or any other intermediate state
        await new Promise((resolve) => setTimeout(resolve, 6000));
        maxAttempts--;
      }

      console.error(
        'TikTok upload timed out after 3 minutes. Last status:',
        status
      );
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
