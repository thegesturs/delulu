import { keys } from '@delulu/api/keys';
import { socialQueries } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';

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
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<TikTokProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    socialQueries.getSocialProviderWithDecryptedTokens(socialProviderId),
    () => new TikTokError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.refreshToken) {
      return err(new ProfileNotFoundError('TikTok'));
    }
    return ok({
      id: profile.id,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
    });
  });

// Upload single video to TikTok (no carousel support)
const uploadVideo = (
  videoUrl: string,
  title: string,
  accessToken: string
): ResultAsync<TikTokVideoUploadResponse, SocialProviderError> => {
  const uploadData = {
    source_info: {
      source: 'PULL_FROM_URL',
      video_url: videoUrl,
    },
    post_info: {
      title: title.slice(0, 150) || 'TikTok Video',
      privacy_level: 'SELF_ONLY', // Can be changed to PUBLIC_TO_EVERYONE
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
    (error) => createAPIError('TikTok', error)
  ).map((response) => response.data);
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

  const validMedia = getValidMediaUrls(firstContent.media);
  const videoMedia = validMedia.find(
    (media) => media.mediaType === 'VIDEO' && media.url
  );

  if (!videoMedia?.url) {
    return errAsync(
      new InvalidMediaError('TikTok', 'TikTok requires exactly one video file')
    );
  }

  // TikTok only supports one video per post, ignore any additional media
  if (validMedia.length > 1) {
    console.warn(
      'TikTok: Multiple media files provided, only the first video will be used'
    );
  }

  return uploadVideo(
    videoMedia.url,
    firstContent.text,
    profile.accessToken
  ).map((uploadResponse) => ({
    platformPostId: uploadResponse.data.publish_id,
    postId: content.postId,
    platformId: profile.id,
    platformPostUrl: `https://www.tiktok.com/@username/video/${uploadResponse.data.publish_id}`,
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
    const params = new URLSearchParams({
      client_key: keys().TIKTOK_CLIENT_ID,
      redirect_uri: keys().TIKTOK_CALLBACK_URL,
      response_type: 'code',
      scope: 'user.info.basic,video.publish',
      state: nanoid(10),
    });

    return ok(`https://www.tiktok.com/auth/authorize/?${params.toString()}`);
  },
};
