import { keys } from '@delulu/api/keys';
import { socialQueries } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';

import { nanoid } from 'nanoid';
import type {
  FacebookProfile as InstagramProfile,
  PostContent,
  PostPublishResult,
} from './common-types';
import {
  InstagramError,
  InvalidMediaError,
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
): ResultAsync<InstagramProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    socialQueries.getSocialProviderWithDecryptedTokens(socialProviderId),
    () => new InstagramError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('Instagram'));
    }
    return ok({
      id: profile.id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
    });
  });

// Create media container for single media
const createSingleMediaContainer = (
  media: { url: string; mediaType: 'IMAGE' | 'VIDEO' },
  profile: InstagramProfile,
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

  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/media`;

  const params = new URLSearchParams({
    access_token: profile.accessToken,
    caption,
  });

  if (media.mediaType === 'VIDEO') {
    params.append('media_type', 'REELS');
    params.append('video_url', media.url);
  } else {
    params.append('image_url', media.url);
  }

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error) => createAPIError('Instagram', error)
  ).map((response) => response.data);
};

// Create carousel container for multiple images
const createCarouselContainer = (
  mediaUrls: string[],
  profile: InstagramProfile,
  caption: string
): ResultAsync<InstagramMediaContainer, SocialProviderError> => {
  // First create individual media containers for carousel items
  const createCarouselItems = (): ResultAsync<
    string[],
    SocialProviderError
  > => {
    return ResultAsync.combine(
      mediaUrls.map((url) => {
        const itemEndpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/media`;
        const itemParams = new URLSearchParams({
          image_url: url,
          is_carousel_item: 'true',
          access_token: profile.accessToken,
        });

        return ResultAsync.fromPromise(
          axios.post(`${itemEndpoint}?${itemParams.toString()}`),
          (error) => createAPIError('Instagram', error)
        ).map((response) => response.data.id);
      })
    );
  };

  return createCarouselItems().andThen((mediaIds) => {
    const carouselEndpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/media`;
    const carouselParams = new URLSearchParams({
      media_type: 'CAROUSEL',
      children: mediaIds.join(','),
      caption,
      access_token: profile.accessToken,
    });

    return ResultAsync.fromPromise(
      axios.post(`${carouselEndpoint}?${carouselParams.toString()}`),
      (error) => createAPIError('Instagram', error)
    ).map((response) => response.data);
  });
};

// Publish media container
const publishMediaContainer = (
  containerId: string,
  accessToken: string
): ResultAsync<InstagramMediaPublishResponse, SocialProviderError> => {
  const endpoint = `https://graph.facebook.com/v23.0/${containerId}/publish`;
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error) => createAPIError('Instagram', error)
  ).map((response) => response.data);
};

// Get published media details
const getMediaDetails = (
  mediaId: string,
  accessToken: string
): ResultAsync<InstagramMediaResponse, SocialProviderError> => {
  return ResultAsync.fromPromise(
    axios.get(`https://graph.facebook.com/v23.0/${mediaId}`, {
      params: {
        fields: 'id,permalink',
        access_token: accessToken,
      },
    }),
    (error) => createAPIError('Instagram', error)
  ).map((response) => response.data);
};

// Main publish function - Instagram supports single video OR multiple images
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: InstagramProfile
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
    // Single video (Reels)
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
    .andThen((container) =>
      publishMediaContainer(container.id, profile.accessToken)
    )
    .andThen((publishResponse) =>
      getMediaDetails(publishResponse.id, profile.accessToken).map(
        (mediaDetails) => ({
          platformPostId: publishResponse.id,
          postId: content.postId,
          platformId: profile.id,
          platformPostUrl: mediaDetails.permalink,
          postedAt: new Date(),
        })
      )
    );
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
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights',
      ].join(','),
      state: nanoid(),
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  },
};
