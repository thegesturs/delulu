import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import type { MediaType, PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';

import type { SocialProvider } from './types';

interface ThreadsMediaContainer {
  id: string;
}

interface ThreadsMediaPublishResponse {
  id: string;
}

interface ThreadsMediaResponse {
  id: string;
  permalink: string;
}

async function createMediaContainer(
  media: MediaType | null,
  profile: { profileId: string; accessToken: string },
  text: string,
  options: {
    isCarouselItem?: boolean;
    replyToId?: string;
  } = {}
): Promise<ThreadsMediaContainer> {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    text,
  });

  if (media?.url) {
    const mediaType = media.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    params.append('media_type', mediaType);
    params.append(mediaType === 'VIDEO' ? 'video_url' : 'image_url', media.url);
    if (options.isCarouselItem) {
      params.append('is_carousel_item', 'true');
    }
  } else {
    params.append('media_type', 'TEXT');
  }

  if (options.replyToId) {
    params.append('reply_to_id', options.replyToId);
  }

  const response = await axios.post(`${endpoint}?${params.toString()}`);
  return response.data;
}

async function createCarouselContainer(
  childrenIds: string[],
  profile: { profileId: string; accessToken: string },
  text: string
): Promise<ThreadsMediaContainer> {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    text,
  });

  const response = await axios.post(`${endpoint}?${params.toString()}`);
  return response.data;
}

async function waitForContainerProcessing(
  containerId: string,
  accessToken: string
): Promise<void> {
  let attempts = 0;
  const maxAttempts = 20;
  const delay = 3000; // 3 seconds

  while (attempts < maxAttempts) {
    const statusResponse = await axios.get(
      `https://graph.threads.net/v1.0/${containerId}`,
      {
        params: {
          fields: 'status_code,status',
          access_token: accessToken,
        },
      }
    );

    const status = statusResponse.data.status;
    if (status === 'FINISHED') {
      return;
    }

    if (status === 'ERROR') {
      throw new Error(
        `Media processing failed: ${statusResponse.data.error_message}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    attempts++;
  }

  throw new Error('Media processing timed out.');
}

async function publishContainer(
  creationId: string,
  profile: { profileId: string; accessToken: string }
): Promise<ThreadsMediaPublishResponse> {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads_publish`;
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: profile.accessToken,
  });

  const response = await axios.post(`${endpoint}?${params.toString()}`);
  return response.data;
}

async function getPostDetails(
  mediaId: string,
  accessToken: string
): Promise<ThreadsMediaResponse> {
  const response = await axios.get<ThreadsMediaResponse>(
    `https://graph.threads.net/v1.0/${mediaId}`,
    {
      params: {
        fields: 'id,permalink',
        access_token: accessToken,
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
      message: 'Threads profile not found or is missing required fields.',
    });
  }
  return profile;
}

export const threadsProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await getAccessTokenAndProfile(socialProviderId);
    const posts = content.content.sort((a, b) => a.order - b.order);

    if (posts.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish.',
      });
    }

    let lastPostId: string | undefined;
    let lastPostDetails: ThreadsMediaResponse | undefined;

    for (const post of posts) {
      const validMedia = getValidMediaUrls(post.media);
      let containerId: string;

      if (validMedia.length > 1) {
        // Carousel post
        const itemContainerIds = await Promise.all(
          validMedia.map((media) =>
            createMediaContainer(media, profile, post.text, {
              isCarouselItem: true,
            }).then((c) => c.id)
          )
        );
        const carouselContainer = await createCarouselContainer(
          itemContainerIds,
          profile,
          post.text
        );
        containerId = carouselContainer.id;
      } else {
        // Single media or text-only post
        const singleContainer = await createMediaContainer(
          validMedia[0] ?? null,
          profile,
          post.text,
          { replyToId: lastPostId }
        );
        containerId = singleContainer.id;
      }

      await waitForContainerProcessing(containerId, profile.accessToken);
      const publishedContainer = await publishContainer(containerId, profile);
      lastPostDetails = await getPostDetails(
        publishedContainer.id,
        profile.accessToken
      );
      lastPostId = publishedContainer.id;
    }

    if (!lastPostDetails || !lastPostId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to publish any content to Threads.',
      });
    }

    return {
      platformPostId: lastPostId,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: lastPostDetails.permalink,
      postedAt: new Date(),
    };
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().THREADS_CLIENT_ID,
      redirect_uri: keys().THREADS_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'threads_basic',
        'threads_content_publish',
        'threads_read_replies',
        'threads_manage_replies',
        'threads_manage_insights',
      ].join(','),
    });

    return `https://threads.net/oauth/authorize?${params.toString()}`;
  },
};
