import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import type { MediaType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { type Result, ResultAsync, err, fromPromise, ok } from 'neverthrow';

import type { SocialProvider } from './types';
import {
  ProfileNotFoundError,
  InvalidMediaError,
  MediaUploadError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
  PublishError,
  NoContentError,
  createAPIError,
  type SocialProviderError,
  ThreadsError,
} from './errors';

interface ThreadsMediaContainer {
  id: string;
}

interface ThreadsMediaPublishResponse {
  id: string;
}

interface ThreadsMediaResponse {
  id: string;
  permalink: string;
  link_attachment_url?: string;
}

async function createMediaContainer(
  media: MediaType | null,
  profile: { profileId: string; accessToken: string },
  text: string,
  options: {
    isCarouselItem?: boolean;
    replyToId?: string;
  } = {}
): Promise<Result<ThreadsMediaContainer, Error>> {
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
    // Extract first URL from text for link preview
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      params.append('link_attachment', urlMatch[0]);
    }
  }

  if (options.replyToId) {
    params.append('reply_to_id', options.replyToId);
  }

  return fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    () => new Error('Failed to create media container')
  ).map((response) => response.data);
}

async function createCarouselContainer(
  childrenIds: string[],
  profile: { profileId: string; accessToken: string },
  text: string
): Promise<Result<ThreadsMediaContainer, Error>> {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    text,
  });

  return fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    () => new Error('Failed to create carousel container')
  ).map((response) => response.data);
}

async function waitForContainerProcessing(
  containerId: string,
  accessToken: string
): Promise<Result<void, Error>> {
  let attempts = 0;
  const maxAttempts = 30;
  const delay = 3000;

  while (attempts < maxAttempts) {
    const statusResult = await fromPromise(
      axios.get(`https://graph.threads.net/v1.0/${containerId}`, {
        params: { access_token: accessToken },
      }),
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 500) {
          return new Error('Server error - container still processing');
        }
        return new Error('Failed to check container processing status');
      }
    );

    if (statusResult.isErr()) {
      if (statusResult.error.message.includes('Server error')) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempts++;
        continue;
      }
      return err(statusResult.error);
    }

    const status = statusResult.value.data.status;
    if (status === 'FINISHED') {
      return ok(undefined);
    }

    if (status === 'ERROR' || status === 'EXPIRED') {
      return err(
        new Error(
          `Media processing failed: ${statusResult.value.data.error_message || status}`
        )
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    attempts++;
  }

  return err(new Error('Media processing timed out.'));
}

async function publishContainer(
  creationId: string,
  profile: { profileId: string; accessToken: string }
): Promise<Result<ThreadsMediaPublishResponse, Error>> {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads_publish`;
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: profile.accessToken,
  });

  return fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    () => new Error('Failed to publish container')
  ).map((response) => response.data);
}

async function getPostDetails(
  mediaId: string,
  accessToken: string
): Promise<Result<ThreadsMediaResponse, Error>> {
  return fromPromise(
    axios.get<ThreadsMediaResponse>(
      `https://graph.threads.net/v1.0/${mediaId}`,
      {
        params: {
          fields: 'id,permalink,link_attachment_url',
          access_token: accessToken,
        },
      }
    ),
    () => new Error('Failed to get post details')
  ).map((response) => response.data);
}

async function getAccessTokenAndProfile(
  socialProviderId: string
): Promise<
  Result<{ id: string; profileId: string; accessToken: string }, Error>
> {
  const [profile] = await database.query.socialProviders.findMany({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile || !profile.accessToken || !profile.profileId) {
    return err(
      new Error('Threads profile not found or is missing required fields.')
    );
  }
  return ok({
    id: profile.id,
    profileId: profile.profileId,
    accessToken: profile.accessToken,
  });
}

export const threadsProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const profileResult = await getAccessTokenAndProfile(socialProviderId);
    if (profileResult.isErr()) {
      return err(profileResult.error);
    }
    const profile = profileResult.value;

    const posts = content.content.sort((a, b) => a.order - b.order);

    if (posts.length === 0) {
      return err(new Error('No content to publish.'));
    }

    let lastPostId: string | undefined;
    let lastPostDetails: ThreadsMediaResponse | undefined;

    for (const post of posts) {
      const validMedia = getValidMediaUrls(post.media);
      let containerId: string;

      if (validMedia.length > 1) {
        // Carousel post - use ResultAsync to handle multiple async operations
        const itemResults = await ResultAsync.combine(
          validMedia.map((media) =>
            ResultAsync.fromPromise(
              createMediaContainer(media, profile, post.text, {
                isCarouselItem: true,
              }),
              (err) => err as Error
            )
          )
        );

        if (itemResults.isErr()) {
          return err(itemResults.error);
        }

        const itemContainerIds = itemResults.value.map(
          (container) => container.id
        );
        const carouselResult = await createCarouselContainer(
          itemContainerIds,
          profile,
          post.text
        );

        if (carouselResult.isErr()) {
          return err(carouselResult.error);
        }

        containerId = carouselResult.value.id;
      } else {
        // Single media or text-only post
        const singleResult = await createMediaContainer(
          validMedia[0] ?? null,
          profile,
          post.text,
          { replyToId: lastPostId }
        );

        if (singleResult.isErr()) {
          return err(singleResult.error);
        }

        containerId = singleResult.value.id;
      }

      const processingResult = await waitForContainerProcessing(
        containerId,
        profile.accessToken
      );
      if (processingResult.isErr()) {
        return err(processingResult.error);
      }

      const publishResult = await publishContainer(containerId, profile);
      if (publishResult.isErr()) {
        return err(publishResult.error);
      }

      const detailsResult = await getPostDetails(
        publishResult.value.id,
        profile.accessToken
      );
      if (detailsResult.isErr()) {
        return err(detailsResult.error);
      }

      lastPostDetails = detailsResult.value;
      lastPostId = publishResult.value.id;
    }

    if (!lastPostDetails || !lastPostId) {
      return err(new Error('Failed to publish any content to Threads.'));
    }

    return ok({
      platformPostId: lastPostId,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: lastPostDetails.permalink,
      postedAt: new Date(),
    });
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

    return ok(`https://threads.net/oauth/authorize?${params.toString()}`);
  },
};
