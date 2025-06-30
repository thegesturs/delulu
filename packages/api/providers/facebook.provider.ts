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
  });

  const response = await axios.post<FacebookMediaUploadResponse>(
    `${endpoint}?${params.toString()}`
  );
  return response.data.id;
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

  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/videos`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    file_url: media.url,
    published: 'false',
  });

  const response = await axios.post<FacebookMediaUploadResponse>(
    `${endpoint}?${params.toString()}`
  );
  return response.data.id;
}

async function createFeedPost(
  profile: { profileId: string; accessToken: string },
  message: string,
  mediaIds: string[] = []
): Promise<FacebookPostResponse> {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/feed`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    message,
  });

  if (mediaIds.length > 0) {
    params.append(
      'attached_media',
      JSON.stringify(mediaIds.map((id) => ({ media_fbid: id })))
    );
  }

  const response = await axios.post<FacebookPostResponse>(
    `${endpoint}?${params.toString()}`
  );
  return response.data;
}

async function getPostDetails(
  postId: string,
  accessToken: string
): Promise<FacebookPostDetails> {
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
        if (media.mediaType === 'VIDEO') {
          const videoId = await uploadVideo(media, profile);
          mediaIds.push(videoId);
        } else {
          const photoId = await uploadPhoto(media, profile);
          mediaIds.push(photoId);
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
      app_id: keys().FACEBOOK_CLIENT_ID,
      redirect_uri: keys().FACEBOOK_CALLBACK_URL,
      response_type: 'code',
      return_scopes: 'false',
      fblfb: 'false',
      kid_directed_site: 'false',
      scope: [
        'public_profile',
        'pages_show_list',
        'pages_manage_posts',
        'pages_read_engagement',
        'read_insights',
        'pages_manage_engagement',
        'pages_read_user_content',
        'business_management',
      ].join(','),
      state: JSON.stringify({ state: nanoid(10) }),
      tp: 'unspecified',
      is_limited_login_shim: 'false',
      source: 'gdp_delegated',
    });

    return `https://www.facebook.com/privacy/consent/gdp/?${params.toString()}`;
  },
};
