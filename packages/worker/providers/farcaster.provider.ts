import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';

import type { PostContent, PostPublishResult } from './common-types';
import {
  FarcasterError,
  InvalidMediaError,
  ProfileNotFoundError,
  type SocialProviderError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Farcaster-specific profile interface
interface FarcasterProfile {
  id: string;
  fid: string;
  signerUuid: string;
}

// Farcaster API types
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

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<FarcasterProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new FarcasterError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('Farcaster'));
    }
    return ok({
      id: profile._id,
      fid: profile.profileId, // Farcaster uses FID as profileId
      signerUuid: profile.accessToken, // Signer UUID stored as accessToken
    });
  });

// Submit cast to Farcaster
const submitCast = (
  profile: FarcasterProfile,
  castData: FarcasterCastRequest
): ResultAsync<FarcasterCastResponse, SocialProviderError> => {
  return ResultAsync.fromPromise(
    axios.post('https://api.warpcast.com/v2/casts', castData, {
      headers: {
        Authorization: `Bearer ${profile.signerUuid}`,
        'Content-Type': 'application/json',
      },
    }),
    (error) => createAPIError('Farcaster', error)
  ).map((response) => response.data.result.cast);
};

// Main publish function - Farcaster supports text and embeds
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: FarcasterProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const firstContent = content.content[0];

  if (!firstContent) {
    return errAsync(
      new InvalidMediaError('Farcaster', 'No content to publish')
    );
  }

  // Farcaster doesn't upload media directly, but can embed URLs
  const validMedia = getValidMediaUrls(firstContent.media);
  const embeds = validMedia
    .filter((media): media is typeof media & { url: string } => !!media.url)
    .map((media) => ({ url: media.url }));

  const castData: FarcasterCastRequest = {
    text: firstContent.text,
    ...(embeds.length > 0 && { embeds }),
  };

  return submitCast(profile, castData).map((castResponse) => ({
    platformPostId: castResponse.hash,
    postId: content.postId,
    platformId: profile.id,
    platformPostUrl: `https://warpcast.com/${profile.fid}/${castResponse.hash}`,
    postedAt: new Date(castResponse.timestamp * 1000),
  }));
};

// Provider implementation
export const farcasterProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },

  connectUrl: () => {
    // Farcaster uses a different auth flow through Warpcast
    // This would typically redirect to Warpcast for signer approval
    return 'https://warpcast.com/~/developers/signed-key-requests';
  },
};
