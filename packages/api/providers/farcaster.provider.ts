import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import type { PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';

import type { SocialProvider } from './types';

interface FarcasterCastRequest {
  text: string;
  embeds?: Array<{
    url: string;
  }>;
  parent?: string;
}

interface FarcasterCastResponse {
  hash: string;
  timestamp: number;
  fid: number;
  text: string;
}

async function submitCast(
  profile: { fid: string; signerKey: string },
  castData: FarcasterCastRequest
): Promise<FarcasterCastResponse> {
  const messageBytes = createCastMessage(profile, castData);
  
  const response = await axios.post<FarcasterCastResponse>(
    'https://hub.pinata.cloud/v1/submitMessage',
    messageBytes,
    {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }
  );

  return response.data;
}

function createCastMessage(
  profile: { fid: string; signerKey: string },
  castData: FarcasterCastRequest
): Buffer {
  const message = {
    data: {
      type: 'MESSAGE_TYPE_CAST_ADD',
      fid: Number.parseInt(profile.fid),
      timestamp: Math.floor(Date.now() / 1000),
      network: 'FARCASTER_NETWORK_MAINNET',
      castAddBody: {
        text: castData.text.slice(0, 320),
        embeds: castData.embeds || [],
        mentions: [],
        mentionsPositions: [],
      },
    },
    hash: '',
    hashScheme: 'HASH_SCHEME_BLAKE3',
    signature: '',
    signatureScheme: 'SIGNATURE_SCHEME_ED25519',
    signer: profile.signerKey,
  };

  return Buffer.from(JSON.stringify(message));
}

async function getAccessTokenAndProfile(socialProviderId: string) {
  const profile = await database.socialProvider.findUnique({
    where: {
      id: socialProviderId,
    },
  });

  if (!profile || !profile.profileId || !profile.accessToken) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Farcaster profile not found or is missing required fields.',
    });
  }
  return {
    ...profile,
    fid: profile.profileId,
    signerKey: profile.accessToken,
  };
}

export const farcasterProvider: SocialProvider = {
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
      const embeds = validMedia
        .map(media => media.url ? { url: media.url } : null)
        .filter((embed): embed is { url: string } => embed !== null);

      const castData: FarcasterCastRequest = {
        text: firstContent.text,
        embeds: embeds.length > 0 ? embeds : undefined,
      };

      const castResponse = await submitCast(profile, castData);
      const castUrl = `https://warpcast.com/${profile.profileId}/${castResponse.hash}`;

      return {
        platformPostId: castResponse.hash,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: castUrl,
        postedAt: new Date(castResponse.timestamp * 1000),
      };
    } catch (error) {
      console.error('Error posting to Farcaster:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Farcaster API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to Farcaster',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().FARCASTER_CLIENT_ID,
      redirect_uri: keys().FARCASTER_REDIRECT_URI,
      response_type: 'code',
      scope: [
        'read',
        'write',
      ].join(','),
    });

    return `https://warpcast.com/~/developers/oauth?${params.toString()}`;
  },
};