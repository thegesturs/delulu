import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import type { MediaType, PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';

import type { SocialProvider } from './types';

interface PinterestBoardResponse {
  id: string;
  name: string;
}

interface PinterestPinResponse {
  id: string;
  link: string;
}

async function getDefaultBoard(profile: {
  accessToken: string;
}): Promise<PinterestBoardResponse> {
  const response = await axios.get<{ items: PinterestBoardResponse[] }>(
    'https://api.pinterest.com/v5/boards',
    {
      headers: {
        Authorization: `Bearer ${profile.accessToken}`,
      },
    }
  );

  const boards = response.data.items;
  if (boards.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No boards found for this Pinterest account',
    });
  }

  return boards[0];
}

async function createPin(
  media: MediaType,
  profile: { accessToken: string },
  note: string,
  boardId: string
): Promise<PinterestPinResponse> {
  if (!media.url) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Media URL is required for Pinterest pins',
    });
  }

  const pinData = {
    note: note || '',
    board_id: boardId,
    media_source: {
      source_type: 'image_url',
      url: media.url,
    },
  };

  const response = await axios.post<PinterestPinResponse>(
    'https://api.pinterest.com/v5/pins',
    pinData,
    {
      headers: {
        Authorization: `Bearer ${profile.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

async function getAccessTokenAndProfile(socialProviderId: string) {
  const profile = await database.query.socialProviders.findFirst({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
  });

  if (!profile || !profile.accessToken) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Pinterest profile not found or is missing required fields.',
    });
  }
  return profile;
}

export const pinterestProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await getAccessTokenAndProfile(socialProviderId);
    const firstContent = content.content[0];

    if (!firstContent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish.',
      });
    }

    try {
      const validMedia = getValidMediaUrls(firstContent.media);

      if (validMedia.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Pinterest requires at least one image to create a pin.',
        });
      }

      const firstMedia = validMedia[0];
      if (firstMedia.mediaType === 'VIDEO') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Pinterest API v5 does not support video uploads via this endpoint.',
        });
      }

      const defaultBoard = await getDefaultBoard(profile);
      const pinResponse = await createPin(
        firstMedia,
        profile,
        firstContent.text,
        defaultBoard.id
      );

      return {
        platformPostId: pinResponse.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: pinResponse.link,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting to Pinterest:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Pinterest API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to Pinterest',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().PINTEREST_CLIENT_ID,
      redirect_uri: keys().PINTEREST_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'boards:read',
        'pins:read',
        'pins:write',
        'user_accounts:read',
      ].join(','),
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  },
};
