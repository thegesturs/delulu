import { keys } from '@delulu/api/keys';
import { database as db, socialProviders } from '@delulu/database';
import {
  type MediaType,
  type PostReturnType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { ok, err, type Result } from 'neverthrow';
import type { SocialProvider } from './types';

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

async function uploadSingleMedia(
  media: MediaType,
  profile: { profileId: string; accessToken: string },
  caption: string,
  isPartOfCarousel = false
): Promise<Result<InstagramMediaContainer, Error>> {
  if (!media.url) {
    return err(new Error('Media URL is required'));
  }

  const isVideo = media.mediaType === 'VIDEO';
  const endpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;

  const mediaParams: Record<string, string> = {
    access_token: profile.accessToken,
    caption: caption || '',
    // If it's a single video and not part of carousel, publish as REELS
    media_type: isVideo ? (isPartOfCarousel ? 'VIDEO' : 'REELS') : 'IMAGE',
  };
  mediaParams[isVideo ? 'video_url' : 'image_url'] = media.url;

  try {
    const params = new URLSearchParams(mediaParams);
    const response = await axios.post(`${endpoint}?${params.toString()}`);
    return ok(response.data);
  } catch (error) {
    return err(new Error('Failed to upload media to Instagram'));
  }
}

async function createCarouselContainer(
  mediaContainers: InstagramMediaContainer[],
  profile: { profileId: string; accessToken: string },
  caption: string
): Promise<Result<string, Error>> {
  const endpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    caption: caption || '',
    media_type: 'CAROUSEL',
    children: mediaContainers.map((container) => container.id).join(','),
  });

  try {
    const response = await axios.post(`${endpoint}?${params.toString()}`);
    return ok(response.data.id);
  } catch (error) {
    return err(new Error('Failed to create carousel container'));
  }
}

async function waitForMediaProcessing(
  containerId: string,
  profile: { accessToken: string }
): Promise<Result<void, Error>> {
  let maxAttempts = 30;
  while (maxAttempts > 0) {
    try {
      const statusResponse = await axios.get(
        `https://graph.instagram.com/v23.0/${containerId}`,
        {
          params: {
            access_token: profile.accessToken,
            fields: 'status_code',
          },
        }
      );

      const status = statusResponse.data.status_code;
      if (status === 'FINISHED') {
        return ok(undefined);
      }

      if (status === 'ERROR') {
        return err(new Error('Media processing failed'));
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      maxAttempts--;
    } catch (error) {
      return err(new Error('Failed to check media processing status'));
    }
  }

  return err(new Error('Media processing timed out'));
}

async function publishMedia(
  containerId: string,
  profile: { profileId: string; accessToken: string }
): Promise<Result<string, Error>> {
  const endpoint = `https://graph.instagram.com/v23.0/${profile.profileId}/media_publish`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    creation_id: containerId,
  });

  try {
    const response = await axios.post<InstagramMediaPublishResponse>(
      `${endpoint}?${params.toString()}`
    );
    return ok(response.data.id);
  } catch (error) {
    return err(new Error('Failed to publish media'));
  }
}

async function getMediaDetails(
  mediaId: string,
  profile: { accessToken: string }
): Promise<Result<InstagramMediaResponse, Error>> {
  try {
    const response = await axios.get<InstagramMediaResponse>(
      `https://graph.instagram.com/v23.0/${mediaId}`,
      {
        params: {
          access_token: profile.accessToken,
          fields: 'id,permalink',
        },
      }
    );
    return ok(response.data);
  } catch (error) {
    return err(new Error('Failed to get media details'));
  }
}

async function getAccessTokenAndProfile(socialProviderId: string): Promise<Result<{ id: string; profileId: string; accessToken: string }, Error>> {
  const [profile] = await db.query.socialProviders.findMany({
    where: (socialProviders, { eq }) => eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile || !profile.accessToken || !profile.profileId) {
    return err(new Error('Instagram profile not found'));
  }

  return ok({
    id: profile.id,
    profileId: profile.profileId,
    accessToken: profile.accessToken,
  });
}

export const instagramProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const profileResult = await getAccessTokenAndProfile(socialProviderId);
    if (profileResult.isErr()) {
      return err(profileResult.error);
    }
    const profile = profileResult.value;

    const firstContent = content.content[0];
    if (!firstContent) {
      return err(new Error('No content to publish'));
    }

    // Validate media
    const validMedia = getValidMediaUrls(firstContent.media);
    if (validMedia.length === 0) {
      return err(new Error(
        'No valid media found. Instagram requires at least one image or video.'
      ));
    }

    // Upload all media
    const mediaResults = await Promise.all(
      validMedia.map((media) =>
        uploadSingleMedia(
          media,
          profile,
          firstContent.text,
          validMedia.length > 1
        )
      )
    );

    // Check if any uploads failed
    for (const result of mediaResults) {
      if (result.isErr()) {
        return err(result.error);
      }
    }

    const mediaContainers = mediaResults.map(r => r._unsafeUnwrap());

    // Create carousel container if multiple media
    let finalContainerId: string;
    if (mediaContainers.length > 1) {
      const carouselResult = await createCarouselContainer(
        mediaContainers,
        profile,
        firstContent.text
      );
      if (carouselResult.isErr()) {
        return err(carouselResult.error);
      }
      finalContainerId = carouselResult.value;
    } else {
      finalContainerId = mediaContainers[0].id;
    }

    // Wait for media processing
    const processingResult = await waitForMediaProcessing(finalContainerId, profile);
    if (processingResult.isErr()) {
      return err(processingResult.error);
    }

    // Publish the media
    const publishResult = await publishMedia(finalContainerId, profile);
    if (publishResult.isErr()) {
      return err(publishResult.error);
    }

    // Get final media details
    const detailsResult = await getMediaDetails(publishResult.value, profile);
    if (detailsResult.isErr()) {
      return err(detailsResult.error);
    }

    const mediaDetails = detailsResult.value;

    return ok({
      platformPostId: mediaDetails.id,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: mediaDetails.permalink,
      postedAt: new Date(),
    });
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
      force_reauth: 'false',
    });

    return ok(`https://www.instagram.com/oauth/authorize?${params.toString()}`);
  },
};