import { keys } from '@delulu/api/keys';
import { socialQueries } from '@delulu/database';
import type {} from '@delulu/validators/post';
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

interface LinkedInPostResponse {
  id: string;
}

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<LinkedInProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    socialQueries.getSocialProviderWithDecryptedTokens(socialProviderId),
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

// Helper: Upload video to LinkedIn and return asset URN
const uploadVideoToLinkedIn = (
  videoUrl: string,
  profileId: string,
  accessToken: string
): ResultAsync<string, SocialProviderError> => {
  // Step 1: Download the video as a buffer
  return ResultAsync.fromPromise(
    axios.get(videoUrl, { responseType: 'arraybuffer' }),
    (error) => new InvalidMediaError('LinkedIn', 'Failed to download video')
  ).andThen((response) => {
    const videoBuffer = response.data;
    // Step 2: Register upload with LinkedIn
    return ResultAsync.fromPromise(
      axios.post(
        'https://api.linkedin.com/rest/videos?action=initializeUpload',
        {
          initializeUploadRequest: {
            owner: `urn:li:person:${profileId}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202405',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      ),
      (error) => createAPIError('LinkedIn', error)
    ).andThen((registerRes) => {
      const uploadUrl = registerRes.data.value.uploadUrl;
      const assetUrn = registerRes.data.value.video;
      // Step 3: Upload the video binary to LinkedIn
      return ResultAsync.fromPromise(
        axios.put(uploadUrl, videoBuffer, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
        }),
        (error) => new MediaUploadError('LinkedIn', 'VIDEO')
      ).map(() => assetUrn);
    });
  });
};

// Helper: Build LinkedIn post data for any media type
interface LinkedInMediaAsset {
  assetUrn: string;
  type: 'IMAGE' | 'VIDEO';
  title?: string;
  description?: string;
}

interface BuildLinkedInPostDataOptions {
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

function buildLinkedInPostData(
  authorUrn: string,
  text: string,
  media: LinkedInMediaAsset[],
  shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO',
  options?: BuildLinkedInPostDataOptions
) {
  type LinkedInMediaObject = {
    status: 'READY';
    description?: { text: string };
    media: string;
    title?: { text: string };
  };
  let mediaArr: LinkedInMediaObject[] = [];
  if (shareMediaCategory === 'IMAGE' || shareMediaCategory === 'VIDEO') {
    mediaArr = media.map((m) => ({
      status: 'READY',
      description: m.description ? { text: m.description } : undefined,
      media: m.assetUrn,
      title: m.title ? { text: m.title } : undefined,
    }));
  }
  return {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text,
        },
        shareMediaCategory,
        ...(mediaArr.length > 0 ? { media: mediaArr } : {}),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility':
        options?.visibility || 'PUBLIC',
    },
  };
}

// Helper: Create and publish post to LinkedIn
const createAndPublishPost = (
  text: string,
  mediaAssets: LinkedInMediaAsset[],
  profile: LinkedInProfile,
  isOrg?: boolean
): ResultAsync<LinkedInPostResponse, SocialProviderError> => {
  const authorUrn = isOrg
    ? `urn:li:organization:${profile.id}`
    : `urn:li:person:${profile.id}`;

  const shareMediaCategory =
    mediaAssets.length === 0
      ? 'NONE'
      : mediaAssets[0].type === 'VIDEO'
        ? 'VIDEO'
        : 'IMAGE';

  const postData = buildLinkedInPostData(
    authorUrn,
    text,
    mediaAssets,
    shareMediaCategory
  );

  return ResultAsync.fromPromise(
    axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        Authorization: `Bearer ${profile.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }),
    (error) => createAPIError('LinkedIn', error)
  ).map((response) => response.data);
};

// Main publish function
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: LinkedInProfile,
  isOrg?: boolean
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const firstContent = content.content[0];

  if (!firstContent) {
    return errAsync(new InvalidMediaError('LinkedIn', 'No content to publish'));
  }

  const validMedia = getValidMediaUrls(firstContent.media);
  const imageMedia = validMedia.filter(
    (media) => media.mediaType === 'IMAGE' && media.url
  );
  const videoMedia = validMedia.filter(
    (media) => media.mediaType === 'VIDEO' && media.url
  );

  let uploadPromise: ResultAsync<LinkedInMediaAsset[], SocialProviderError>;

  if (videoMedia.length > 0) {
    // Only support one video per post for now
    const video = videoMedia[0];
    uploadPromise = uploadVideoToLinkedIn(
      video.url!,
      profile.id,
      profile.accessToken
    ).map((assetUrn) => [
      {
        assetUrn,
        type: 'VIDEO',
        title: video.altText || 'Video',
        description: 'Video description',
      },
    ]);
  } else if (imageMedia.length > 0) {
    // Support multiple images
    uploadPromise = ResultAsync.combine(
      imageMedia.map((img) =>
        uploadImageToLinkedIn(img.url!, profile.id, profile.accessToken)
      )
    ).map((assetUrns) =>
      assetUrns.map((assetUrn) => ({
        assetUrn,
        type: 'IMAGE',
        title: 'Image',
        description: 'Image description',
      }))
    );
  } else {
    uploadPromise = ResultAsync.fromPromise(
      Promise.resolve([]) as Promise<LinkedInMediaAsset[]>,
      () => new LinkedInError('Empty media array')
    );
  }

  return uploadPromise
    .andThen((mediaAssets) =>
      createAndPublishPost(firstContent.text, mediaAssets, profile, isOrg)
    )
    .map((postResponse) => ({
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
    const scopes = [
      'r_member_postAnalytics',
      'r_organization_followers',
      'r_organization_social',
      'rw_organization_admin',
      'r_organization_social_feed',
      'w_member_social',
      'r_member_profileAnalytics',
      'w_organization_social',
      'r_basicprofile',
      'w_organization_social_feed',
      'w_member_social_feed',
    ].join('%20');

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${keys().LINKEDIN_CLIENT_ID}&redirect_uri=${keys().LINKEDIN_CALLBACK_URL}&scope=${scopes}`;
    return url;
  },
};
