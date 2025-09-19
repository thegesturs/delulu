import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import {
  type TikTokSettings,
  getValidMediaUrls,
  promotionContentTypes,
} from '@delulu/validators/post';
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

// Creator info and video validation are now handled in frontend via tRPC endpoints

// Check the status of a TikTok video upload
const checkPostStatus = (
  accessToken: string,
  publishId: string
): ResultAsync<{ status: string; fail_reason?: string }, SocialProviderError> => {
  return ResultAsync.fromPromise(
    axios.post(
      'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      {
        publish_id: publishId
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    ),
    (error) => {
      console.error('[TikTok] Failed to check post status:', error);
      return createAPIError('TikTok', error);
    }
  ).andThen((response) => {
    const data = response.data;
    if (!data.data) {
      return err(new TikTokError('Failed to get post status from TikTok response'));
    }

    return ok({
      status: data.data.status,
      fail_reason: data.data.fail_reason
    });
  });
};

// Poll post status until completion or failure (following YouTube pattern)
const waitForPostCompletion = (
  accessToken: string,
  publishId: string,
  maxAttempts = 30,
  interval = 10000
): ResultAsync<void, SocialProviderError> => {
  const poll = async (attempts: number): Promise<void> => {
    if (attempts >= maxAttempts) {
      throw new TikTokError('Post processing timeout - exceeded maximum attempts');
    }

    const statusResult = await checkPostStatus(accessToken, publishId);
    if (statusResult.isErr()) {
      throw statusResult.error;
    }

    const { status, fail_reason } = statusResult.value;

    if (status === 'Published') {
      return; // Success
    }

    if (status === 'Failed') {
      throw new TikTokError(`Post failed: ${fail_reason || 'Unknown error'}`);
    }

    // Status is still 'Processing', continue polling
    await new Promise(resolve => setTimeout(resolve, interval));
    return poll(attempts + 1);
  };

  return ResultAsync.fromPromise(poll(0), (error) => error as SocialProviderError);
};

// Upload single video to TikTok with user settings
const uploadVideo = (
  accessToken: string,
  videoUrl: string,
  caption: string,
  settings?: TikTokSettings
): ResultAsync<TikTokVideoUploadResponse, SocialProviderError> => {
  // Build post_info with user settings or defaults
  // biome-ignore lint/suspicious/noExplicitAny: <Dont want to declare the type>
  const postInfo: any = {
    title: caption.slice(0, 150) || 'TikTok Video',
    privacy_level: settings?.privacy || 'PUBLIC_TO_EVERYONE',
    disable_duet: settings?.allowDuet === false,
    disable_comment: settings?.allowComments === false,
    disable_stitch: settings?.allowStitch === false,
    video_cover_timestamp_ms: 1000, // Sets thumbnail at 1 second into video
  };

  // Add commercial content disclosure based on promotionContent type
  if (
    settings?.promotionContent &&
    settings.promotionContent !== promotionContentTypes.NONE
  ) {
    postInfo.brand_content_toggle = true;

    if (settings.promotionContent === promotionContentTypes.SELF) {
      postInfo.brand_organic_toggle = true;
      postInfo.branded_content_toggle = false;
    } else if (settings.promotionContent === promotionContentTypes.PAID) {
      postInfo.brand_organic_toggle = false;
      postInfo.branded_content_toggle = true;
    } else if (settings.promotionContent === promotionContentTypes.BOTH) {
      postInfo.brand_organic_toggle = true;
      postInfo.branded_content_toggle = true;
    }
  }

  const uploadData = {
    source_info: {
      source: 'PULL_FROM_URL',
      video_url: videoUrl,
    },
    post_info: postInfo,
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

// Main publish function with settings support
const publishContent = (
  content: {
    content: PostContent[];
    postId: string;
    tiktokSettings?: TikTokSettings;
  },
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

  // Use text content as TikTok caption (what users see on the video)
  const caption = firstContent.text || 'TikTok Video';

  // Get fresh access token and upload (validation is done in frontend)
  return getFreshAccessToken(profile.refreshToken)
    .andThen((freshAccessToken) =>
      uploadVideo(
        freshAccessToken,
        videoMedia.url!,
        caption,
        content.tiktokSettings
      )
        .andThen((uploadResponse) =>
          // Poll for completion as required by TikTok guidelines
          waitForPostCompletion(freshAccessToken, uploadResponse.data.publish_id)
            .map(() => uploadResponse)
        )
    )
    .map((uploadResponse) => ({
      platformPostId: uploadResponse.data.publish_id,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: `https://www.tiktok.com/@${profile.username}/video/${uploadResponse.data.publish_id}`,
      postedAt: new Date(),
    }));
};

// Provider implementation with settings support
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
