import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';

import type {
  BaseProviderProfile as LinkedInProfile,
  PostContent,
  PostPublishResult,
} from './common-types';
import {
  InvalidMediaError,
  LinkedInError,
  MediaUploadError,
  ProfileNotFoundError,
  type SocialProviderError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';
import { nanoid } from 'nanoid';

interface LinkedInPostResponse {
  id: string;
}

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<LinkedInProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    database.query.socialProviders.findFirst({
      where: (socialProviders, { eq }) =>
        eq(socialProviders.id, socialProviderId),
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

// Helper: Upload image to LinkedIn and return asset URN
const uploadImageToLinkedIn = (
  imageUrl: string,
  profileId: string,
  accessToken: string
): ResultAsync<string, SocialProviderError> => {
  // Step 1: Download the image as a buffer
  return ResultAsync.fromPromise(
    axios.get(imageUrl, { responseType: 'arraybuffer' }),
    (error) => new InvalidMediaError('LinkedIn', 'Failed to download image')
  ).andThen((response) => {
    const imageBuffer = response.data;
    // Step 2: Register upload with LinkedIn
    return ResultAsync.fromPromise(
      axios.post(
        'https://api.linkedin.com/rest/images?action=initializeUpload',
        {
          initializeUploadRequest: {
            owner: `urn:li:person:${profileId}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202405', // Use current version
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      ),
      (error) => createAPIError('LinkedIn', error)
    ).andThen((registerRes) => {
      const uploadUrl = registerRes.data.value.uploadUrl;
      const assetUrn = registerRes.data.value.image;
      // Step 3: Upload the image binary to LinkedIn
      return ResultAsync.fromPromise(
        axios.put(uploadUrl, imageBuffer, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
        }),
        (error) => new MediaUploadError('LinkedIn', 'IMAGE')
      ).map(() => assetUrn);
    });
  });
};

// Create text-only post
const createTextPost = (
  text: string,
  profileId: string,
  accessToken: string
): ResultAsync<LinkedInPostResponse, SocialProviderError> => {
  const postData = {
    author: `urn:li:person:${profileId}`,
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
  ).map((response) => response.data);
};

// Create post with images (LinkedIn supports multiple images)
const createImagePost = (
  text: string,
  imageUrls: string[],
  profileId: string,
  accessToken: string
): ResultAsync<LinkedInPostResponse, SocialProviderError> => {
  // Upload all images and get asset URNs
  return ResultAsync.combine(
    imageUrls.map((url) => uploadImageToLinkedIn(url, profileId, accessToken))
  ).andThen((assetUrns) => {
    const media = assetUrns.map((assetUrn) => ({
      status: 'READY',
      description: {
        text: 'Image description',
      },
      media: assetUrn,
      title: {
        text: 'Image',
      },
    }));
    const postData = {
      author: `urn:li:person:${profileId}`,
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
    ).map((response) => response.data);
  });
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
  const imageMedia = validMedia.filter(
    (media) => media.mediaType === 'IMAGE' && media.url
  );
  const videoMedia = validMedia.filter((media) => media.mediaType === 'VIDEO');

  // LinkedIn video support is complex and requires special permissions
  if (videoMedia.length > 0) {
    return errAsync(
      new InvalidMediaError(
        'LinkedIn',
        'Video publishing not currently supported'
      )
    );
  }

  let publishPromise: ResultAsync<LinkedInPostResponse, SocialProviderError>;

  if (imageMedia.length === 0) {
    // Text-only post
    publishPromise = createTextPost(
      firstContent.text,
      profile.id,
      profile.accessToken
    );
  } else {
    // Post with images (LinkedIn supports multiple images)
    const imageUrls = imageMedia.map((media) => media.url!);
    publishPromise = createImagePost(
      firstContent.text,
      imageUrls,
      profile.id,
      profile.accessToken
    );
  }

  return publishPromise.map((postResponse) => ({
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
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().LINKEDIN_CLIENT_ID,
      redirect_uri: keys().LINKEDIN_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid profile email w_member_social',
      state: nanoid(16),
    });

    return ok(
      `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    );
  },
};
