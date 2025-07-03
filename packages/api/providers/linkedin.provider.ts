import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ok, err, errAsync, ResultAsync } from 'neverthrow';

import type { SocialProvider } from './types';
import type { 
  BaseProviderProfile as LinkedInProfile,
  PostContent,
  PostPublishResult
} from './common-types';
import {
  ProfileNotFoundError,
  InvalidMediaError,
  createAPIError,
  type SocialProviderError,
  LinkedInError,
} from './errors';

interface LinkedInPostResponse {
  id: string;
}

// Profile management
const getProfile = (socialProviderId: string): ResultAsync<LinkedInProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    database.query.socialProviders.findFirst({
      where: (socialProviders, { eq }) => eq(socialProviders.id, socialProviderId),
    }),
    () => new LinkedInError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken) {
      return err(new ProfileNotFoundError('LinkedIn'));
    }
    return ok({
      id: profile.id,
      accessToken: profile.accessToken,
    });
  });

// Create text-only post
const createTextPost = (
  text: string,
  accessToken: string
): ResultAsync<LinkedInPostResponse, SocialProviderError> => {
  const postData = {
    author: 'urn:li:person:me', // LinkedIn API uses this format for personal posts
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  return ResultAsync.fromPromise(
    axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }),
    (error) => createAPIError('LinkedIn', error)
  ).map(response => response.data);
};

// Create post with images (LinkedIn supports multiple images)
const createImagePost = (
  text: string,
  imageUrls: string[],
  accessToken: string
): ResultAsync<LinkedInPostResponse, SocialProviderError> => {
  const media = imageUrls.map(url => ({
    status: 'READY',
    description: {
      text: 'Image description',
    },
    media: url,
    title: {
      text: 'Image',
    },
  }));

  const postData = {
    author: 'urn:li:person:me',
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'IMAGE',
        media: media,
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  return ResultAsync.fromPromise(
    axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }),
    (error) => createAPIError('LinkedIn', error)
  ).map(response => response.data);
};

// Main publish function - LinkedIn supports text and multiple images (no videos for now)
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: LinkedInProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const firstContent = content.content[0];
  
  if (!firstContent) {
    return errAsync(new InvalidMediaError('LinkedIn', 'No content to publish'));
  }

  const validMedia = getValidMediaUrls(firstContent.media);
  const imageMedia = validMedia.filter(media => media.mediaType === 'IMAGE' && media.url);
  const videoMedia = validMedia.filter(media => media.mediaType === 'VIDEO');

  // LinkedIn video support is complex and requires special permissions
  if (videoMedia.length > 0) {
    return errAsync(new InvalidMediaError('LinkedIn', 'Video publishing not currently supported'));
  }

  let publishPromise: ResultAsync<LinkedInPostResponse, SocialProviderError>;

  if (imageMedia.length === 0) {
    // Text-only post
    publishPromise = createTextPost(firstContent.text, profile.accessToken);
  } else {
    // Post with images (LinkedIn supports multiple images)
    const imageUrls = imageMedia.map(media => media.url!);
    publishPromise = createImagePost(firstContent.text, imageUrls, profile.accessToken);
  }

  return publishPromise.map(postResponse => ({
    platformPostId: postResponse.id,
    postId: content.postId,
    platformId: profile.id,
    platformPostUrl: `https://www.linkedin.com/feed/update/${postResponse.id}`,
    postedAt: new Date(),
  }));
};

// Provider implementation
export const linkedinProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId)
      .andThen(profile => publishContent(content, profile));
    return result;
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().LINKEDIN_CLIENT_ID,
      redirect_uri: keys().LINKEDIN_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid profile email w_member_social',
      state: 'linkedin_oauth_state',
    });

    return ok(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
  },
};