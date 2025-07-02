import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import type { MediaType, PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { nanoid } from 'nanoid';

import type { SocialProvider } from './types';

interface FacebookMediaUploadResponse {
  id: string;
}

interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

interface FacebookPostDetails {
  id: string;
  permalink_url: string;
}

async function uploadPhoto(
  media: MediaType,
  profile: { profileId: string; accessToken: string }
): Promise<string> {
  if (!media.url) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Media URL is required',
    });
  }

  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/photos`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    url: media.url,
    published: 'false',
    temporary: 'true',
  });

  try {
    const response = await axios.post<FacebookMediaUploadResponse>(
      `${endpoint}?${params.toString()}`
    );
    return response.data.id;
  } catch (error) {
    console.error('Error uploading photo to Facebook:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload photo to Facebook',
      cause: error,
    });
  }
}

async function uploadVideo(
  media: MediaType,
  profile: { profileId: string; accessToken: string }
): Promise<string> {
  if (!media.url) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Media URL is required',
    });
  }

  // Step 1: Initialize the video upload
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/videos`;
  const data = {
    access_token: profile.accessToken,
    file_url: media.url,
    description: 'Video upload via API',
    published: false,
    // Add required fields for page video upload
    type: 'video/mp4', // Specify video type
    title: 'Video Post', // Add a title
    is_crossposting_eligible: false, // Disable crossposting
  };

  try {
    // Make sure we're sending as application/json
    const response = await axios.post<FacebookMediaUploadResponse>(
      endpoint,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Step 2: Poll for video processing status
    const videoId = response.data.id;
    let attempts = 0;
    const maxAttempts = 10;
    const pollingInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${videoId}`,
        {
          params: {
            access_token: profile.accessToken,
            fields: 'status,permalink_url',
          },
        }
      );

      const status = statusResponse.data.status?.video_status;
      if (status === 'ready' || status === 'published') {
        return videoId;
      }
      if (status === 'error') {
        throw new Error('Video processing failed');
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      attempts++;
    }

    // If we get here, video is still processing but we'll return the ID anyway
    return videoId;
  } catch (error) {
    console.error('Error uploading video to Facebook:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
      // Add more detailed error information
      const fbError = error.response.data.error;
      if (fbError) {
        console.error('Facebook Error Details:', {
          message: fbError.message,
          type: fbError.type,
          code: fbError.code,
          subcode: fbError.error_subcode,
        });
      }
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload video to Facebook',
      cause: error,
    });
  }
}

async function createFeedPost(
  profile: { profileId: string; accessToken: string },
  message: string,
  mediaIds: string[] = []
): Promise<FacebookPostResponse> {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/feed`;
  const data: {
    access_token: string;
    message: string;
    attached_media?: Array<{ media_fbid: string }>;
  } = {
    access_token: profile.accessToken,
    message,
  };

  if (mediaIds.length > 0) {
    data.attached_media = mediaIds.map((id) => ({ media_fbid: id }));
  }

  try {
    const response = await axios.post<FacebookPostResponse>(endpoint, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Facebook post:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw error;
  }
}

async function getPostDetails(
  postId: string,
  accessToken: string
): Promise<FacebookPostDetails> {
  try {
    const response = await axios.get<FacebookPostDetails>(
      `https://graph.facebook.com/v23.0/${postId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,permalink_url',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting Facebook post details:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw error;
  }
}

async function getAccessTokenAndProfile(socialProviderId: string) {
  const [profile] = await database.query.socialProviders.findMany({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile || !profile.accessToken || !profile.profileId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Facebook profile not found or is missing required fields.',
    });
  }
  return profile;
}

export const facebookProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await getAccessTokenAndProfile(socialProviderId);
    const firstContent = content.content[0];

    if (!firstContent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish.',
      });
    }

    try {
      const validMedia = getValidMediaUrls(firstContent.media);
      const mediaIds: string[] = [];

      for (const media of validMedia) {
        try {
          if (media.mediaType === 'VIDEO') {
            const videoId = await uploadVideo(media, profile);
            mediaIds.push(videoId);
          } else {
            const photoId = await uploadPhoto(media, profile);
            mediaIds.push(photoId);
          }
        } catch (error) {
          console.error('Failed to upload media:', error);
          // Continue with other media if one fails
        }
      }

      const postResponse = await createFeedPost(
        profile,
        firstContent.text,
        mediaIds
      );

      const postDetails = await getPostDetails(
        postResponse.id,
        profile.accessToken
      );

      return {
        platformPostId: postResponse.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: postDetails.permalink_url,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Facebook API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to Facebook',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().FACEBOOK_CLIENT_ID,
      redirect_uri: keys().FACEBOOK_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'public_profile',
        'pages_show_list',
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_read_user_engagement',
        'business_management',
        'pages_manage_metadata',
        'publish_video',
        'pages_read_user_content',
        'pages_manage_instant_articles',
        'pages_manage_engagement',
        'pages_messaging',
        'pages_video_upload', // Add specific video upload permission
      ].join(','),
      state: JSON.stringify({ state: nanoid(10) }),
    });

    return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
  },
};
