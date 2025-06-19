import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import {
  type PostReturnType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import type { SocialProvider } from './types';

interface InstagramMediaContainer {
  id: string;
  status_code?: string;
}

interface InstagramMediaPublishResponse {
  id: string;
}

export const instagramProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await database.socialProvider.findUnique({
      where: {
        id: socialProviderId,
      },
    });

    if (!profile || !profile.accessToken) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Instagram profile not found',
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
        message:
          'No valid media found. Instagram requires at least one image or video.',
      });
    }

    try {
      const mediaContainers: InstagramMediaContainer[] = [];

      // Create media containers for each media item
      for (const media of validMedia) {
        if (!media.url) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Media URL is required',
          });
        }

        const isVideo = media.mediaType === 'VIDEO';
        const endpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;

        const mediaParams: Record<string, string> = {
          access_token: profile.accessToken,
          caption: firstContent.text || '',
          media_type: isVideo ? 'VIDEO' : 'IMAGE',
        };
        mediaParams[isVideo ? 'video_url' : 'image_url'] = media.url;

        const params = new URLSearchParams(mediaParams);
        const response = await axios.post(`${endpoint}?${params.toString()}`);
        mediaContainers.push(response.data);
      }

      // For carousel posts with multiple media items
      let finalContainerId: string;
      if (mediaContainers.length > 1) {
        const carouselEndpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;
        const carouselParams = new URLSearchParams({
          access_token: profile.accessToken,
          caption: firstContent.text || '',
          media_type: 'CAROUSEL',
          children: mediaContainers.map((container) => container.id).join(','),
        });

        const response = await axios.post(
          `${carouselEndpoint}?${carouselParams.toString()}`
        );
        finalContainerId = response.data.id;
      } else {
        finalContainerId = mediaContainers[0].id;
      }

      // Check media container status before publishing
      let maxAttempts = 30;
      while (maxAttempts > 0) {
        const statusResponse = await axios.get(
          `https://graph.instagram.com/v23.0/${finalContainerId}`,
          {
            params: {
              access_token: profile.accessToken,
              fields: 'status_code',
            },
          }
        );

        const status = statusResponse.data.status_code;
        if (status === 'FINISHED') {
          break;
        }

        if (status === 'ERROR') {
          throw new Error('Media processing failed');
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        maxAttempts--;
      }

      if (maxAttempts === 0) {
        throw new Error('Media processing timed out');
      }

      // Publish the media
      const publishEndpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media_publish`;
      const publishParams = new URLSearchParams({
        access_token: profile.accessToken,
        creation_id: finalContainerId,
      });

      const publishResponse = await axios.post<InstagramMediaPublishResponse>(
        `${publishEndpoint}?${publishParams.toString()}`
      );

      return {
        platformPostId: publishResponse.data.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: `https://www.instagram.com/p/${publishResponse.data.id}`,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting to Instagram:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Instagram API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to Instagram',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().INSTAGRAM_CLIENT_ID,
      redirect_uri: keys().INSTAGRAM_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights',
      ].join(','),
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  },
};
