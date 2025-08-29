import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';
import { keys } from '../key';

import type {
  PostContent,
  PostPublishResult,
  TikTokProfile,
  TikTokVideoUploadResponse,
} from './common-types';
import {
  InvalidMediaError,
  ProfileNotFoundError,
  type SocialProviderError,
  TikTokError,
  TokenRefreshError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Get fresh access token using refresh token (following YouTube pattern)
const getFreshAccessToken = (
  refreshToken: string
): ResultAsync<string, SocialProviderError> => {
  console.log('[TikTok] Getting fresh access token using client:', {
    clientId: keys().TIKTOK_CLIENT_ID,
    hasClientSecret: !!keys().TIKTOK_CLIENT_SECRET,
  });

  const refreshData = new URLSearchParams({
    client_key: keys().TIKTOK_CLIENT_ID,
    client_secret: keys().TIKTOK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  return ResultAsync.fromPromise(
    axios.post('https://open.tiktokapis.com/v2/oauth/token/', refreshData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
    (error) => {
      console.error('[TikTok] Failed to get fresh access token:', error);
      return new TokenRefreshError(
        'TikTok',
        'Failed to get fresh access token'
      );
    }
  ).andThen((response) => {
    const accessToken = response.data.access_token;
    if (!accessToken) {
      return err(new TokenRefreshError('TikTok', 'No access token received'));
    }
    console.log('[TikTok] Fresh access token obtained successfully');
    return ok(accessToken);
  });
};

// Profile management (following YouTube pattern)
const getProfile = (
  socialProviderId: string
): ResultAsync<TikTokProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new TikTokError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile?.refreshToken) {
      return err(new ProfileNotFoundError('TikTok'));
    }
    return ok({
      id: profile._id,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      username: profile.username!,
      profileId: profile.profileId!,
    });
  });

// Upload single video to TikTok (no carousel support)
const uploadVideo = (
  accessToken: string,
  videoUrl: string,
  title: string
): ResultAsync<TikTokVideoUploadResponse, SocialProviderError> => {
  const uploadData = {
    source_info: {
      source: 'PULL_FROM_URL',
      video_url: videoUrl,
    },
    post_info: {
      title: title.slice(0, 150) || 'TikTok Video',
      privacy_level: 'SELF_ONLY',
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000,
    },
  };

  return ResultAsync.fromPromise(
    axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      uploadData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    ),
    (error) => {
      const axiosError = error as {
        response?: { data?: unknown; status?: number };
      };
      console.log('[TikTok] Upload failed:', {
        status: axiosError?.response?.status,
        data: JSON.stringify(axiosError?.response?.data, null, 2),
        message: (error as Error).message,
        requestData: uploadData,
      });
      return createAPIError('TikTok', error);
    }
  ).andThen((response) => {
    const data = response.data;
    if (!data.data?.publish_id) {
      return err(
        new TikTokError('Failed to get publish ID from TikTok response')
      );
    }

    return ok({
      data: {
        publish_id: data.data.publish_id,
      },
    });
  });
};

// Main publish function - only supports single video
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: TikTokProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const firstContent = content.content[0];

  if (!firstContent) {
    return errAsync(new InvalidMediaError('TikTok', 'No content to publish'));
  }

  // TikTok requires video content
  const validMedia = getValidMediaUrls(firstContent.media);
  const videoMedia = validMedia.find(
    (media) => media.mediaType === 'VIDEO' && media.url
  );

  if (!videoMedia?.url) {
    return errAsync(
      new InvalidMediaError('TikTok', 'TikTok requires exactly one video file')
    );
  }

  // Get fresh access token first (following YouTube pattern)
  return getFreshAccessToken(profile.refreshToken)
    .andThen((freshAccessToken) =>
      uploadVideo(freshAccessToken, videoMedia.url!, firstContent.text || '')
    )
    .map((uploadResponse) => ({
      platformPostId: uploadResponse.data.publish_id,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: `https://www.tiktok.com/@${profile.username}/video/${uploadResponse.data.publish_id}`,
      postedAt: new Date(),
    }));
};

// Provider implementation
export const tiktokProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },

  connectUrl: () => {
    console.log('[TikTok] Generating connect URL');

    const params = new URLSearchParams({
      response_type: 'code',
      client_key: keys().TIKTOK_CLIENT_ID,
      redirect_uri: keys().TIKTOK_CALLBACK_URL,
      scope: 'user.info.basic,video.publish,video.upload,user.info.profile',
      state: nanoid(10),
    });

    const connectUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

    console.log('[TikTok] Connect URL generated:', {
      url: connectUrl,
      clientId: keys().TIKTOK_CLIENT_ID ? 'present' : 'missing',
      redirectUri: keys().TIKTOK_CALLBACK_URL,
    });

    return connectUrl;
  },
};
