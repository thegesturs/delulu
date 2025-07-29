import { keys } from '@delulu/api/keys';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import type { MediaType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow';

import type {
  BaseProviderProfile,
  FacebookMediaUploadResponse,
  FacebookPostDetails,
  FacebookPostResponse,
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

const createPhotoUploadParams = (
  profile: BaseProviderProfile,
  mediaUrl: string
): URLSearchParams => {
  console.log('[Facebook] Creating photo upload params:', {
    mediaUrl,
    profileId: profile.profileId,
  });
  return new URLSearchParams({
    access_token: profile.accessToken,
    url: mediaUrl,
    published: 'false',
    temporary: 'false', // Changed from 'true' to 'false'
  });
};

const createVideoInitParams = (accessToken: string) => ({
  upload_phase: 'start',
  access_token: accessToken,
});

const createFeedPostData = (
  profile: BaseProviderProfile,
  message: string,
  mediaIds: string[]
) => {
  console.log('[Facebook] Creating feed post data:', {
    message,
    mediaIds,
    profileId: profile.profileId,
  });

  const data: Record<string, string | { media_fbid: string }[]> = {
    access_token: profile.accessToken,
    message,
    published: '1', // Make post public
  };

  // Add attached_media in the correct format for Facebook API
  if (mediaIds.length > 0) {
    data.attached_media = mediaIds.map((id) => ({ media_fbid: id }));
    console.log('[Facebook] Adding attached media:', data.attached_media);
  }

  return data;
};

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<BaseProviderProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new FacebookError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('Facebook'));
    }
    return ok({
      id: profile._id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
      username: profile.username!,
    });
  });

// Media upload functions
const uploadPhoto = (
  media: MediaType,
  profile: BaseProviderProfile
): ResultAsync<string, SocialProviderError> => {
  if (!media.url) {
    console.error('[Facebook] Photo upload failed: Media URL is required');
    return errAsync(new InvalidMediaError('Facebook', 'Media URL is required'));
  }

  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/photos`;
  const params = createPhotoUploadParams(profile, media.url);

  console.log('[Facebook] Uploading photo:', { endpoint, mediaUrl: media.url });

  return ResultAsync.fromPromise(
    axios.post<FacebookMediaUploadResponse>(`${endpoint}?${params.toString()}`),
    (error) => {
      console.error('[Facebook] Photo upload error:', error);
      return createAPIError('Facebook', error);
    }
  ).map((response) => {
    console.log('[Facebook] Photo upload success:', response.data);
    return response.data.id;
  });
};

const initializeReelUpload = (
  profile: BaseProviderProfile
): ResultAsync<FacebookVideoInitResponse, SocialProviderError> => {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`;

  console.log('[Facebook] Initializing reel upload:', {
    endpoint,
    profileId: profile.profileId,
  });

  return ResultAsync.fromPromise(
    axios.post(endpoint, createVideoInitParams(profile.accessToken)),
    (error) => {
      console.error('[Facebook] Reel initialization error:', error);
      return createAPIError('Facebook', error);
    }
  ).andThen((response) => {
    console.log('[Facebook] Reel initialization response:', response.data);
    const { video_id: videoId, upload_url: uploadUrl } = response.data;
    if (!videoId || !uploadUrl) {
      console.error(
        '[Facebook] Reel initialization failed: missing video_id or upload_url'
      );
      return err(new MediaUploadError('Facebook', 'VIDEO'));
    }
    return ok({ videoId, uploadUrl });
  });
};

const uploadReelContent = (
  uploadUrl: string,
  videoUrl: string,
  accessToken: string
): ResultAsync<void, SocialProviderError> => {
  console.log('[Facebook] Uploading reel content:', { uploadUrl, videoUrl });

  // First fetch the video from the URL, then upload it to Facebook
  return ResultAsync.fromPromise(
    axios.get(videoUrl, { responseType: 'arraybuffer' }),
    (error) => {
      console.error('[Facebook] Failed to fetch video from URL:', error);
      return createAPIError('Facebook', error);
    }
  ).andThen((response) => {
    console.log('[Facebook] Video fetched, uploading to Facebook...');
    const videoBuffer = Buffer.from(response.data);

    return ResultAsync.fromPromise(
      axios.post(uploadUrl, videoBuffer, {
        headers: {
          Authorization: `OAuth ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          file_size: videoBuffer.length.toString(),
          offset: '0',
        },
        maxContentLength: Number.POSITIVE_INFINITY,
        maxBodyLength: Number.POSITIVE_INFINITY,
        timeout: 300000, // 5 minutes timeout for large videos
      }),
      (error) => {
        return createAPIError('Facebook', error);
      }
    ).andThen((uploadResponse) => {
      console.log(
        '[Facebook] Reel content upload response:',
        uploadResponse.data
      );
      console.log('[Facebook] Reel content uploaded successfully');
      return ok(undefined);
    });
  });
};

const checkVideoStatus = (
  videoId: string,
  accessToken: string
): ResultAsync<FacebookVideoStatus, SocialProviderError> => {
  console.log('[Facebook] Checking video status:', { videoId });

  return ResultAsync.fromPromise(
    axios.get(`https://graph.facebook.com/v23.0/${videoId}`, {
      params: {
        fields: 'status,id,title,description,updated_time',
        access_token: accessToken,
      },
    }),
    (error) => {
      console.error('[Facebook] Video status check error:', error);
      return createAPIError('Facebook', error);
    }
  ).map((response) => {
    console.log('[Facebook] Video status response:', response.data);
    return response.data.status;
  });
};

const publishReel = (
  profile: BaseProviderProfile,
  videoId: string,
  description: string
): ResultAsync<string, SocialProviderError> => {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`;

  console.log('[Facebook] Publishing reel:', {
    endpoint,
    videoId,
    description,
  });

  return ResultAsync.fromPromise(
    axios.post(endpoint, {
      video_id: videoId,
      upload_phase: 'finish',
      description: description,
      access_token: profile.accessToken,
      published: '1', // Make reel public
    }),
    (error) => {
      console.error('[Facebook] Reel publish error:', error);
      return createAPIError('Facebook', error);
    }
  ).andThen((response) => {
    console.log('[Facebook] Reel publish response:', response.data);
    if (!response.data.success) {
      console.error('[Facebook] Reel publish failed: success=false');
      return err(new PublishError('Facebook', 'Reel publish failed'));
    }
    console.log('[Facebook] Reel published successfully');
    // Always return video_id - we need to wait for processing to complete
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
  console.log('[Facebook] Starting video processing wait:', {
    videoId,
    maxAttempts,
    interval,
  });

  const poll = (attempts: number): ResultAsync<void, SocialProviderError> => {
    console.log(`[Facebook] Polling attempt ${attempts + 1}/${maxAttempts}`);

    if (attempts >= maxAttempts) {
      console.error('[Facebook] Video processing timeout');
      return errAsync(new MediaProcessingTimeoutError('Facebook'));
    }

    return checkVideoStatus(videoId, accessToken).andThen((status) => {
      console.log(`[Facebook] Video status: ${status.video_status}`);

      // Handle error status - stop immediately
      if (status.video_status === 'error') {
        console.error('[Facebook] Video processing failed with error status');
        if (status.processing_phase?.errors) {
          console.error(
            '[Facebook] Processing errors:',
            status.processing_phase.errors
          );
        }
        return errAsync(
          new MediaProcessingError('Facebook', 'Video processing failed')
        );
      }

      // Handle processing phase errors
      if (status.processing_phase?.status === 'error') {
        console.error('[Facebook] Video processing phase failed');
        if (status.processing_phase?.errors) {
          console.error(
            '[Facebook] Processing errors:',
            status.processing_phase.errors
          );
        }
        return errAsync(
          new MediaProcessingError('Facebook', 'Video processing phase failed')
        );
      }

      if (
        status.video_status === 'ready' ||
        status.video_status === 'published' ||
        (status.video_status === 'upload_complete' &&
          status.processing_phase?.status === 'complete')
      ) {
        console.log('[Facebook] Video processing completed successfully');
        return okAsync(undefined);
      }

      console.log(
        `[Facebook] Video still processing, waiting ${interval}ms...`
      );
      return ResultAsync.fromPromise(
        new Promise((resolve) => setTimeout(resolve, interval)),
        () => new MediaProcessingError('Facebook', 'Timeout error')
      ).andThen(() => poll(attempts + 1));
    });
  };

  return poll(0);
};

// Post creation
const createFeedPost = (
  profile: BaseProviderProfile,
  message: string,
  mediaIds: string[] = []
): ResultAsync<FacebookPostResponse, SocialProviderError> => {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/feed`;
  const data = createFeedPostData(profile, message, mediaIds);

  console.log('[Facebook] Creating feed post:', { endpoint, data });

  return ResultAsync.fromPromise(
    axios.post<FacebookPostResponse>(endpoint, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
    (error) => {
      console.error('[Facebook] Feed post creation error:', error);
      return createAPIError('Facebook', error);
    }
  ).map((response) => {
    console.log('[Facebook] Feed post creation success:', response.data);
    return response.data;
  });
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
  profile: BaseProviderProfile,
  text: string
): ResultAsync<string, SocialProviderError> => {
  if (media.mediaType === 'VIDEO') {
    return processReelMedia(media, profile, text);
  }
  return uploadPhoto(media, profile);
};

const processReelMedia = (
  media: MediaType,
  profile: BaseProviderProfile,
  text: string
): ResultAsync<string, SocialProviderError> => {
  if (!media.url) {
    return errAsync(new InvalidMediaError('Facebook', 'Video URL is required'));
  }

  return initializeReelUpload(profile).andThen(({ videoId, uploadUrl }) =>
    uploadReelContent(uploadUrl, media.url!, profile.accessToken)
      .andThen(() => publishReel(profile, videoId, text))
      .andThen(() => waitForVideoProcessing(videoId, profile.accessToken))
      .andThen(() => okAsync(videoId))
  );
};

// Main publish function - clean composition
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: BaseProviderProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  console.log('[Facebook] Starting content publish:', {
    contentLength: content.content.length,
    postId: content.postId,
  });

  const firstContent = content.content[0];
  if (!firstContent) {
    console.error('[Facebook] No content to publish');
    return errAsync(new InvalidMediaError('Facebook', 'No content to publish'));
  }

  const validMedia = getValidMediaUrls(firstContent.media);
  console.log('[Facebook] Valid media found:', validMedia.length);

  // Process all media in parallel
  return ResultAsync.combine(
    validMedia.map((media) => processMedia(media, profile, firstContent.text))
  ).andThen((mediaIds) => {
    console.log('[Facebook] Media processing complete:', { mediaIds });

    // Check if we have videos (reels are standalone)
    const hasVideos = validMedia.some((media) => media.mediaType === 'VIDEO');
    console.log(
      '[Facebook] Content type:',
      hasVideos ? 'VIDEO/REEL' : 'PHOTO/TEXT'
    );

    if (hasVideos && mediaIds.length > 0) {
      // Return reel info directly
      const result = {
        platformPostId: mediaIds[0],
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: `https://www.facebook.com/${profile.profileId}/videos/${mediaIds[0]}`,
        postedAt: new Date(),
      };
      console.log('[Facebook] Reel publish result:', result);
      return okAsync(result);
    }

    // Create feed post for photos/text
    return createFeedPost(profile, firstContent.text, mediaIds).andThen(
      (postResponse) => {
        console.log('[Facebook] Feed post created:', postResponse);
        return getPostDetails(postResponse.id, profile.accessToken).map(
          (postDetails) => {
            const result = {
              platformPostId: postResponse.id,
              postId: content.postId,
              platformId: profile.id,
              platformPostUrl: postDetails.permalink_url,
              postedAt: new Date(),
            };
            console.log('[Facebook] Feed post publish result:', result);
            return result;
          }
        );
      }
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
        'business_management',
        'publish_video',
      ].join(','),
      state: JSON.stringify({ state: nanoid(10) }),
    });

    return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
  },
};
