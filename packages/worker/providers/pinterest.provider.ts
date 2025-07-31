import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import type { MediaType, PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';
import { keys } from '../key';

import { nanoid } from 'nanoid';
import {
  InvalidMediaError,
  PinterestError,
  ProfileNotFoundError,
  PublishError,
  type SocialProviderError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Types
interface PinterestProfile {
  id: string;
  accessToken: string;
}

interface PinterestBoardResponse {
  id: string;
  name: string;
}

interface PinterestPinResponse {
  id: string;
  link: string;
}

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<PinterestProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new PinterestError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken) {
      return err(new ProfileNotFoundError('Pinterest'));
    }
    return ok({
      id: profile._id,
      accessToken: profile.accessToken,
    });
  });

// Get user boards
const getUserBoards = (
  accessToken: string
): ResultAsync<PinterestBoardResponse[], SocialProviderError> =>
  ResultAsync.fromPromise(
    axios.get('https://api.pinterest.com/v5/boards', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    (error) => createAPIError('Pinterest', error)
  ).map((response) => response.data.items || []);

// Create pin
const createPin = (
  media: MediaType,
  text: string,
  boardId: string,
  accessToken: string
): ResultAsync<PinterestPinResponse, SocialProviderError> => {
  if (!media.url) {
    return errAsync(
      new InvalidMediaError('Pinterest', 'Media URL is required')
    );
  }

  const pinData = {
    link: media.url,
    title: text.slice(0, 100) || 'Pin',
    description: text || '',
    board_id: boardId,
    media_source: {
      source_type: 'image_url',
      url: media.url,
    },
  };

  return ResultAsync.fromPromise(
    axios.post('https://api.pinterest.com/v5/pins', pinData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }),
    (error) => createAPIError('Pinterest', error)
  ).map((response) => response.data);
};

// Main publish function
const publishContent = (
  content: {
    content: Array<{ text: string; media: MediaType[] }>;
    postId: string;
  },
  profile: PinterestProfile
): ResultAsync<PostReturnType, SocialProviderError> => {
  const firstContent = content.content[0];

  if (!firstContent) {
    return errAsync(
      new InvalidMediaError('Pinterest', 'No content to publish')
    );
  }

  const validMedia = getValidMediaUrls(firstContent.media);
  const imageMedia = validMedia.find(
    (media) => media.mediaType === 'IMAGE' && media.url
  );

  if (!imageMedia) {
    return errAsync(
      new InvalidMediaError('Pinterest', 'Pinterest requires an image')
    );
  }

  return getUserBoards(profile.accessToken)
    .andThen((boards) => {
      if (boards.length === 0) {
        return err(new PublishError('Pinterest', 'No boards available'));
      }

      // Use the first available board
      const boardId = boards[0].id;
      return createPin(
        imageMedia,
        firstContent.text,
        boardId,
        profile.accessToken
      );
    })
    .map((pinResponse) => ({
      platformPostId: pinResponse.id,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: pinResponse.link,
      postedAt: new Date(),
    }));
};

// Provider implementation
export const pinterestProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().PINTEREST_CLIENT_ID,
      redirect_uri: keys().PINTEREST_CALLBACK_URL,
      response_type: 'code',
      scope: 'boards:read,pins:write',
      state: nanoid(),
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  },
};
