import { keys } from '@delulu/api/keys';
import { socialQueries } from '@delulu/database';
import type { MediaType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow';

import type {
  FacebookMediaUploadResponse,
  FacebookPostDetails,
  FacebookPostResponse,
  FacebookProfile,
  FacebookVideoInitResponse,
  FacebookVideoStatus,
  PostContent,
  PostPublishResult,
} from './common-types';
import {
  FacebookError,
  InvalidMediaError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
  MediaUploadError,
  ProfileNotFoundError,
  PublishError,
  type SocialProviderError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Pure functions for data transformation
const createPhotoUploadParams = (
  profile: FacebookProfile,
  mediaUrl: string
): URLSearchParams =>
  new URLSearchParams({
    access_token: profile.accessToken,
    url: mediaUrl,
    published: 'false',
    temporary: 'true',
  });

const createVideoInitParams = (accessToken: string) => ({
  upload_phase: 'start',
  access_token: accessToken,
});

const createFeedPostData = (
  profile: FacebookProfile,
  message: string,
  mediaIds: string[]
) => ({
  access_token: profile.accessToken,
  message,
  ...(mediaIds.length > 0 && {
    attached_media: mediaIds.map((id) => ({ media_fbid: id })),
  }),
});

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<FacebookProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    socialQueries.getSocialProviderWithDecryptedTokens(socialProviderId),
    () => new FacebookError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('Facebook'));
    }
    return ok({
      id: profile.id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
    });
  });

// Media upload functions
const uploadPhoto = (
  media: MediaType,
  profile: FacebookProfile
): ResultAsync<string, SocialProviderError> => {
  if (!media.url) {
    return errAsync(new InvalidMediaError('Facebook', 'Media URL is required'));
  }

  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/photos`;
  const params = createPhotoUploadParams(profile, media.url);

  return ResultAsync.fromPromise(
    axios.post<FacebookMediaUploadResponse>(`${endpoint}?${params.toString()}`),
    (error) => createAPIError('Facebook', error)
  ).map((response) => response.data.id);
};

const initializeVideoUpload = (
  profile: FacebookProfile,
  isReel = false
): ResultAsync<FacebookVideoInitResponse, SocialProviderError> => {
  const endpoint = isReel
    ? `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`
    : `https://graph.facebook.com/v23.0/${profile.profileId}/videos`;

  return ResultAsync.fromPromise(
    axios.post(endpoint, createVideoInitParams(profile.accessToken)),
    (error) => createAPIError('Facebook', error)
  ).andThen((response) => {
    const { video_id: videoId, upload_url: uploadUrl } = response.data;
    if (!videoId || !uploadUrl) {
      return err(new MediaUploadError('Facebook', 'VIDEO'));
    }
    return ok({ videoId, uploadUrl });
  });
};

const uploadVideoContent = (
  videoId: string,
  videoUrl: string,
  accessToken: string
): ResultAsync<void, SocialProviderError> => {
  const uploadEndpoint = `https://rupload.facebook.com/video-upload/v23.0/${videoId}`;

  return ResultAsync.fromPromise(
    axios.post(uploadEndpoint, null, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        file_url: videoUrl,
      },
    }),
    (error) => createAPIError('Facebook', error)
  ).andThen((response) => {
    if (!response.data.success) {
      return err(new MediaUploadError('Facebook', 'VIDEO'));
    }
    return ok(undefined);
  });
};

const checkVideoStatus = (
  videoId: string,
  accessToken: string
): ResultAsync<FacebookVideoStatus, SocialProviderError> =>
  ResultAsync.fromPromise(
    axios.get(`https://graph.facebook.com/v23.0/${videoId}`, {
      params: {
        fields: 'status,id,title,description,updated_time',
        access_token: accessToken,
      },
    }),
    (error) => createAPIError('Facebook', error)
  ).map((response) => response.data.status);

const publishVideo = (
  profile: FacebookProfile,
  videoId: string,
  description: string,
  isReel = false,
  isInitialProcessing = false
): ResultAsync<string, SocialProviderError> => {
  const endpoint = isReel
    ? `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`
    : `https://graph.facebook.com/v23.0/${profile.profileId}/videos`;

  return ResultAsync.fromPromise(
    axios.post(endpoint, {
      video_id: videoId,
      upload_phase: 'finish',
      video_state: isInitialProcessing ? 'DRAFT' : 'PUBLISHED',
      description: description,
      access_token: profile.accessToken,
    }),
    (error) => createAPIError('Facebook', error)
  ).andThen((response) => {
    if (!response.data.success) {
      return err(new PublishError('Facebook', 'Video publish failed'));
    }
    return ok(videoId);
  });
};

// Video processing with polling
const waitForVideoProcessing = (
  videoId: string,
  accessToken: string,
  maxAttempts = 30,
  interval = 10000
): ResultAsync<void, SocialProviderError> => {
  const poll = async (attempts: number): Promise<void> => {
    if (attempts >= maxAttempts) {
      throw new MediaProcessingTimeoutError('Facebook');
    }

    const statusResult = await checkVideoStatus(videoId, accessToken);
    if (statusResult.isErr()) {
      throw statusResult.error;
    }

    const status = statusResult.value;

    if (
      status.video_status === 'ready' ||
      status.video_status === 'published'
    ) {
      return;
    }

    if (status.processing_phase?.error) {
      throw new MediaProcessingError(
        'Facebook',
        status.processing_phase.error.message
      );
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    return poll(attempts + 1);
  };

  return ResultAsync.fromPromise(
    poll(0),
    (error) => error as SocialProviderError
  );
};

// Post creation
const createFeedPost = (
  profile: FacebookProfile,
  message: string,
  mediaIds: string[] = []
): ResultAsync<FacebookPostResponse, SocialProviderError> => {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/feed`;
  const data = createFeedPostData(profile, message, mediaIds);

  return ResultAsync.fromPromise(
    axios.post<FacebookPostResponse>(endpoint, data, {
      headers: { 'Content-Type': 'application/json' },
    }),
    (error) => createAPIError('Facebook', error)
  ).map((response) => response.data);
};

const getPostDetails = (
  postId: string,
  accessToken: string
): ResultAsync<FacebookPostDetails, SocialProviderError> =>
  ResultAsync.fromPromise(
    axios.get<FacebookPostDetails>(
      `https://graph.facebook.com/v23.0/${postId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,permalink_url',
        },
      }
    ),
    (error) => createAPIError('Facebook', error)
  ).map((response) => response.data);

// Media processing pipeline
const processMedia = (
  media: MediaType,
  profile: FacebookProfile,
  text: string
): ResultAsync<string, SocialProviderError> => {
  if (media.mediaType === 'VIDEO') {
    return processVideoMedia(media, profile, text);
  }
  return uploadPhoto(media, profile);
};

const processVideoMedia = (
  media: MediaType,
  profile: FacebookProfile,
  text: string
): ResultAsync<string, SocialProviderError> => {
  if (!media.url) {
    return errAsync(new InvalidMediaError('Facebook', 'Video URL is required'));
  }

  const isReel = true; // Always post as reel

  return initializeVideoUpload(profile, isReel).andThen(({ videoId }) =>
    uploadVideoContent(videoId, media.url!, profile.accessToken)
      .andThen(() => waitForVideoProcessing(videoId, profile.accessToken))
      .map(() => videoId)
  );
};

// Main publish function - clean composition
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: FacebookProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const firstContent = content.content[0];
  if (!firstContent) {
    return errAsync(new InvalidMediaError('Facebook', 'No content to publish'));
  }

  const validMedia = getValidMediaUrls(firstContent.media);

  // Process all media in parallel
  return ResultAsync.combine(
    validMedia.map((media) => processMedia(media, profile, firstContent.text))
  ).andThen((mediaIds) => {
    // Check if we have videos (reels are standalone)
    const hasVideos = validMedia.some((media) => media.mediaType === 'VIDEO');

    if (hasVideos && mediaIds.length > 0) {
      // Return reel info directly
      return okAsync({
        platformPostId: mediaIds[0],
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: `https://www.facebook.com/${profile.profileId}/videos/${mediaIds[0]}`,
        postedAt: new Date(),
      });
    }

    // Create feed post for photos/text
    return createFeedPost(profile, firstContent.text, mediaIds).andThen(
      (postResponse) =>
        getPostDetails(postResponse.id, profile.accessToken).map(
          (postDetails) => ({
            platformPostId: postResponse.id,
            postId: content.postId,
            platformId: profile.id,
            platformPostUrl: postDetails.permalink_url,
            postedAt: new Date(),
          })
        )
    );
  });
};

// Provider implementation
export const facebookProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
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
      ].join(','),
      state: JSON.stringify({ state: nanoid(10) }),
    });

    return ok(`https://www.facebook.com/dialog/oauth?${params.toString()}`);
  },
};
