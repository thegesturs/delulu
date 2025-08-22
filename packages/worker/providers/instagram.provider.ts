import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { type Result, ResultAsync, err, errAsync, ok } from 'neverthrow';
import { keys } from '../key';

import { nanoid } from 'nanoid';
import type {
  BaseProviderProfile,
  PostContent,
  PostPublishResult,
} from './common-types';
import {
  InstagramError,
  InvalidMediaError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
  ProfileNotFoundError,
  type SocialProviderError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Instagram API response types
interface InstagramMediaContainer {
  id: string;
  status_code?: string;
}

interface InstagramContainerStatus {
  id: string;
  status_code: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
}

interface InstagramMediaPublishResponse {
  id: string;
}

interface InstagramMediaResponse {
  id: string;
  permalink: string;
}

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<BaseProviderProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new InstagramError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('Instagram'));
    }
    return ok({
      id: profile._id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
      username: profile.username ?? '',
    });
  });

// Create media container for single media
const createSingleMediaContainer = (
  media: { url: string; mediaType: 'IMAGE' | 'VIDEO' },
  profile: BaseProviderProfile,
  caption: string
): ResultAsync<InstagramMediaContainer, SocialProviderError> => {
  // Validate caption length - Instagram limit is 2200 characters
  if (caption.length > 2200) {
    return errAsync(
      new InvalidMediaError(
        'Instagram',
        "Caption exceeds Instagram's 2200 character limit"
      )
    );
  }

  console.log(
    `[Instagram] Creating ${media.mediaType.toLowerCase()} container${media.mediaType === 'VIDEO' ? ' (Instagram will fetch video from URL)' : ''}`
  );

  const endpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;

  const params = new URLSearchParams({
    access_token: profile.accessToken,
    caption,
  });

  if (media.mediaType === 'VIDEO') {
    params.append('media_type', 'REELS');
    params.append('video_url', media.url);
    // Add share_to_feed parameter for REELS
    params.append('share_to_feed', 'true');
  } else {
    params.append('image_url', media.url);
  }

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error: unknown) => createAPIError('Instagram', error)
  ).map((response) => {
    console.log(
      `[Instagram] Container created successfully: ${response.data.id}`
    );
    return response.data;
  });
};

// Create carousel container for multiple images
const createCarouselContainer = (
  mediaUrls: string[],
  profile: BaseProviderProfile,
  caption: string
): ResultAsync<InstagramMediaContainer, SocialProviderError> => {
  // First create individual media containers for carousel items
  const createCarouselItems = (): ResultAsync<
    string[],
    SocialProviderError
  > => {
    return ResultAsync.combine(
      mediaUrls.map((url) => {
        const itemEndpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;
        const itemParams = new URLSearchParams({
          image_url: url,
          is_carousel_item: 'true',
          access_token: profile.accessToken,
        });

        return ResultAsync.fromPromise(
          axios.post(`${itemEndpoint}?${itemParams.toString()}`),
          (error: unknown) => createAPIError('Instagram', error)
        ).map((response) => response.data.id);
      })
    );
  };

  return createCarouselItems().andThen((mediaIds) => {
    const carouselEndpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;
    const carouselParams = new URLSearchParams({
      media_type: 'CAROUSEL',
      children: mediaIds.join(','),
      caption,
      access_token: profile.accessToken,
    });

    return ResultAsync.fromPromise(
      axios.post(`${carouselEndpoint}?${carouselParams.toString()}`),
      (error: unknown) => createAPIError('Instagram', error)
    ).map((response) => response.data);
  });
};

// Publish media container
const publishMediaContainer = (
  containerId: string,
  profileId: string,
  accessToken: string
): ResultAsync<InstagramMediaPublishResponse, SocialProviderError> => {
  console.log(`[Instagram] Publishing container: ${containerId}`);

  const endpoint = `https://graph.instagram.com/v23.0/${profileId}/media_publish`;
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error: unknown) => {
      console.log(
        `[Instagram] Publishing failed for container: ${containerId}`
      );
      return createAPIError('Instagram', error);
    }
  ).map((response) => {
    console.log(
      `[Instagram] Published successfully with media ID: ${response.data.id}`
    );
    return response.data;
  });
};

// Check container status
const checkContainerStatus = (
  containerId: string,
  accessToken: string
): ResultAsync<InstagramContainerStatus, SocialProviderError> => {
  console.log(`[Instagram] Checking container status for: ${containerId}`);

  return ResultAsync.fromPromise(
    axios.get(`https://graph.instagram.com/v23.0/${containerId}`, {
      params: {
        fields: 'id,status_code',
        access_token: accessToken,
      },
    }),
    (error: unknown) => {
      console.log(
        `[Instagram] ❌ Container status check failed for ${containerId}:`,
        error
      );
      return createAPIError('Instagram', error);
    }
  ).map((response) => {
    console.log(
      `[Instagram] Raw status response for ${containerId}:`,
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  });
};

// Wait for container processing to complete
const waitForContainerProcessing = (
  containerId: string,
  accessToken: string,
  maxAttempts = 60, // Increased from 30 to 60 (10 minutes total)
  interval = 10000
): ResultAsync<void, SocialProviderError> => {
  const startTime = Date.now();
  console.log(
    `[Instagram] Starting to monitor container processing: ${containerId} (max ${maxAttempts} attempts, ${(maxAttempts * interval) / 1000 / 60} minutes)`
  );

  const poll = async (attempts: number): Promise<void> => {
    console.log(
      `[Instagram] 🔄 Polling attempt ${attempts + 1}/${maxAttempts} for container: ${containerId}`
    );

    if (attempts >= maxAttempts) {
      const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      console.log(
        `[Instagram] Container processing timeout after ${maxAttempts} attempts (${elapsedMinutes.toFixed(1)} minutes): ${containerId}`
      );
      throw new MediaProcessingTimeoutError('Instagram');
    }

    let statusResult: Result<InstagramContainerStatus, SocialProviderError>;
    try {
      statusResult = await checkContainerStatus(containerId, accessToken);
      if (statusResult.isErr()) {
        console.log(
          `[Instagram] ❌ Status check error for ${containerId}:`,
          statusResult.error
        );
        throw statusResult.error;
      }

      console.log(`[Instagram] ✅ Status check success for ${containerId}`);
    } catch (error) {
      console.log(
        `[Instagram] ❌ Unexpected error in status check for ${containerId}:`,
        error
      );
      throw error;
    }

    const status = statusResult.value;
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;

    // Log warning if processing is taking longer than expected
    if (attempts > 10 && status.status_code === 'IN_PROGRESS') {
      console.log(
        `[Instagram] ⚠️  Container still processing after ${elapsedMinutes.toFixed(1)} minutes (attempt ${attempts + 1}): ${containerId}`
      );
    } else {
      console.log(
        `[Instagram] Container status (attempt ${attempts + 1}): ${status.status_code} for ${containerId}`
      );
    }

    if (status.status_code === 'FINISHED') {
      const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      console.log(
        `[Instagram] Container processing completed after ${elapsedMinutes.toFixed(1)} minutes: ${containerId}`
      );
      return;
    }

    if (status.status_code === 'ERROR') {
      const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      console.log(
        `[Instagram] Container processing error after ${elapsedMinutes.toFixed(1)} minutes for ${containerId}`
      );
      throw new MediaProcessingError(
        'Instagram',
        `Container processing failed (failed after ${elapsedMinutes.toFixed(1)} minutes)`
      );
    }

    if (status.status_code === 'IN_PROGRESS') {
      await new Promise((resolve) => setTimeout(resolve, interval));
      return poll(attempts + 1);
    }
  };

  return ResultAsync.fromPromise(poll(0), (error: unknown) => {
    console.log(
      `[Instagram] ❌ Processing wait failed for ${containerId}:`,
      error
    );

    if (
      error instanceof MediaProcessingTimeoutError ||
      error instanceof MediaProcessingError
    ) {
      return error;
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown polling error';
    return new MediaProcessingError(
      'Instagram',
      `Container processing failed: ${errorMessage}`
    );
  }).map((result) => {
    console.log(
      `[Instagram] ✅ Processing wait completed successfully for ${containerId}`
    );
    return result;
  });
};

// Get published media details
const getMediaDetails = (
  mediaId: string,
  accessToken: string
): ResultAsync<InstagramMediaResponse, SocialProviderError> => {
  return ResultAsync.fromPromise(
    axios.get(`https://graph.instagram.com/v23.0/${mediaId}`, {
      params: {
        fields: 'id,permalink',
        access_token: accessToken,
      },
    }),
    (error: unknown) => createAPIError('Instagram', error)
  ).map((response) => response.data);
};

// Main publish function - Instagram supports single video OR multiple images
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: BaseProviderProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const firstContent = content.content[0];

  if (!firstContent) {
    return errAsync(
      new InvalidMediaError('Instagram', 'No content to publish')
    );
  }

  const validMedia = getValidMediaUrls(firstContent.media);

  if (validMedia.length === 0) {
    return errAsync(
      new InvalidMediaError(
        'Instagram',
        'Instagram requires at least one image or video'
      )
    );
  }

  // Check for videos - Instagram supports only ONE video (Reels)
  const videoMedia = validMedia.filter(
    (media) => media.mediaType === 'VIDEO' && media.url
  );
  const imageMedia = validMedia.filter(
    (media) => media.mediaType === 'IMAGE' && media.url
  );

  if (videoMedia.length > 1) {
    return errAsync(
      new InvalidMediaError(
        'Instagram',
        'Instagram supports only one video per post'
      )
    );
  }

  if (videoMedia.length > 0 && imageMedia.length > 0) {
    return errAsync(
      new InvalidMediaError(
        'Instagram',
        'Instagram does not support mixing videos and images'
      )
    );
  }

  let containerPromise: ResultAsync<
    InstagramMediaContainer,
    SocialProviderError
  >;

  if (videoMedia.length === 1) {
    // Single video (Reels) - Instagram will fetch video from URL
    containerPromise = createSingleMediaContainer(
      { url: videoMedia[0].url!, mediaType: 'VIDEO' },
      profile,
      firstContent.text
    );
  } else if (imageMedia.length === 1) {
    // Single image
    containerPromise = createSingleMediaContainer(
      { url: imageMedia[0].url!, mediaType: 'IMAGE' },
      profile,
      firstContent.text
    );
  } else {
    // Multiple images (Carousel)
    const imageUrls = imageMedia.map((media) => media.url!);
    containerPromise = createCarouselContainer(
      imageUrls,
      profile,
      firstContent.text
    );
  }

  return containerPromise
    .andThen((container) => {
      console.log(
        `[Instagram] 📋 Container ready, starting processing wait: ${container.id}`
      );
      // Wait for container processing to complete before publishing
      return waitForContainerProcessing(container.id, profile.accessToken).map(
        () => {
          console.log(
            `[Instagram] ✅ Processing wait completed, container ready for publishing: ${container.id}`
          );
          return container;
        }
      );
    })
    .andThen((container) => {
      console.log(
        `[Instagram] 🚀 Starting media container publish: ${container.id}`
      );
      return publishMediaContainer(
        container.id,
        profile.profileId,
        profile.accessToken
      );
    })
    .andThen((publishResponse) => {
      console.log(
        `[Instagram] 📊 Getting media details for published content: ${publishResponse.id}`
      );
      return getMediaDetails(publishResponse.id, profile.accessToken).map(
        (mediaDetails) => {
          console.log(
            `[Instagram] Post published successfully: ${mediaDetails.permalink}`
          );
          return {
            platformPostId: publishResponse.id,
            postId: content.postId,
            platformId: profile.id,
            platformPostUrl: mediaDetails.permalink,
            postedAt: new Date(),
          };
        }
      );
    });
};

// Provider implementation
export const instagramProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().INSTAGRAM_CLIENT_ID,
      redirect_uri: keys().INSTAGRAM_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'instagram_business_basic',
        'instagram_business_content_publish',
      ].join(','),
      state: nanoid(),
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  },
};
