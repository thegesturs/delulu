import { keys } from '@delulu/api/keys';
import { socialQueries } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';
import type {
  BaseProviderProfile,
  PostContent,
  PostPublishResult,
} from './common-types';

// LinkedIn-specific profile interface
interface LinkedInProfile extends BaseProviderProfile {
  profileId: string;
}
import {
  InvalidMediaError,
  LinkedInError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
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
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('LinkedIn'));
    }

    const linkedinProfile = {
      id: profile.id,
      accessToken: profile.accessToken,
      profileId: profile.profileId,
    };

    return ok(linkedinProfile);
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
    () => new InvalidMediaError('LinkedIn', 'Failed to download image')
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
            'LinkedIn-Version': '202501', // Use current version
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
        () => new MediaUploadError('LinkedIn', 'IMAGE')
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
    (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return new InvalidMediaError(
        'LinkedIn',
        `Failed to download video from ${videoUrl}: ${errorMessage}`
      );
    }
  ).andThen((response) => {
    const videoBuffer = response.data;

    // Step 2: Register upload with LinkedIn
    const initializeRequest = {
      initializeUploadRequest: {
        owner: `urn:li:person:${profileId}`,
        fileSizeBytes: videoBuffer.length,
        uploadCaptions: false,
        uploadThumbnail: false,
      },
    };

    return ResultAsync.fromPromise(
      axios.post(
        'https://api.linkedin.com/rest/videos?action=initializeUpload',
        initializeRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202501',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      ),
      (error) => {
        return createAPIError('LinkedIn', error);
      }
    ).andThen((registerRes) => {
      const uploadInstructions = registerRes.data.value.uploadInstructions;
      const uploadUrl = uploadInstructions[0]?.uploadUrl;
      const assetUrn = registerRes.data.value.video;

      if (!uploadUrl) {
        return err(new MediaUploadError('LinkedIn', 'VIDEO'));
      }

      // Step 3: Upload the video binary to LinkedIn
      return ResultAsync.fromPromise(
        axios.put(uploadUrl, videoBuffer, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
        }),
        () => {
          return new MediaUploadError('LinkedIn', 'VIDEO');
        }
      ).andThen((uploadResponse) => {
        // Step 4: Finalize the upload
        const uploadToken = registerRes.data.value.uploadToken;
        const uploadedPartIds = [uploadResponse.headers.etag];

        return ResultAsync.fromPromise(
          axios.post(
            'https://api.linkedin.com/rest/videos?action=finalizeUpload',
            {
              finalizeUploadRequest: {
                video: assetUrn,
                uploadToken: uploadToken,
                uploadedPartIds: uploadedPartIds,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': '202501',
                'X-Restli-Protocol-Version': '2.0.0',
              },
            }
          ),
          (error: unknown) => {
            return createAPIError('LinkedIn', error);
          }
        ).map(() => {
          return assetUrn;
        });
      });
    });
  });
};

// Helper: Check video processing status
const checkVideoProcessingStatus = (
  videoUrn: string,
  accessToken: string
): ResultAsync<
  'AVAILABLE' | 'PROCESSING' | 'PROCESSING_FAILED' | 'WAITING_UPLOAD',
  SocialProviderError
> => {
  const encodedUrn = encodeURIComponent(videoUrn);

  return ResultAsync.fromPromise(
    axios.get(`https://api.linkedin.com/rest/videos/${encodedUrn}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202501',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }),
    (error: unknown) => {
      return createAPIError('LinkedIn', error);
    }
  ).map((response) => {
    const status = response.data.status;
    return status;
  });
};

// Helper: Wait for video processing to complete
const waitForVideoProcessing = (
  videoUrn: string,
  accessToken: string,
  maxAttempts = 30,
  interval = 10000
): ResultAsync<void, SocialProviderError> => {
  const poll = async (attempts: number): Promise<void> => {
    if (attempts >= maxAttempts) {
      throw new MediaProcessingTimeoutError('LinkedIn');
    }

    const statusResult = await checkVideoProcessingStatus(
      videoUrn,
      accessToken
    );
    if (statusResult.isErr()) {
      throw statusResult.error;
    }

    const status = statusResult.value;

    if (status === 'AVAILABLE') {
      return;
    }

    if (status === 'PROCESSING_FAILED') {
      throw new MediaProcessingError('LinkedIn', 'Video processing failed');
    }

    if (status === 'PROCESSING' || status === 'WAITING_UPLOAD') {
      await new Promise((resolve) => setTimeout(resolve, interval));
      return poll(attempts + 1);
    }
  };

  return ResultAsync.fromPromise(poll(0), (error: unknown) => {
    if (
      error instanceof MediaProcessingTimeoutError ||
      error instanceof MediaProcessingError
    ) {
      return error;
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown polling error';
    return new MediaProcessingError(
      'LinkedIn',
      `Video processing failed: ${errorMessage}`
    );
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

type PostContentType = 'TEXT_ONLY' | 'SINGLE_IMAGE' | 'MULTI_IMAGE' | 'VIDEO';

function buildLinkedInPostData(
  authorUrn: string,
  text: string,
  media: LinkedInMediaAsset[],
  contentType: PostContentType,
  options?: BuildLinkedInPostDataOptions
) {
  const basePost = {
    author: authorUrn,
    commentary: text,
    visibility: options?.visibility || 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  // Add content based on type
  switch (contentType) {
    case 'TEXT_ONLY':
      return basePost;

    case 'SINGLE_IMAGE':
      return {
        ...basePost,
        content: {
          media: {
            altText: media[0]?.description || 'Image',
            id: media[0]?.assetUrn,
          },
        },
      };

    case 'MULTI_IMAGE':
      return {
        ...basePost,
        content: {
          multiImage: {
            images: media.map((m) => ({
              altText: m.description || 'Image',
              id: m.assetUrn,
            })),
          },
        },
      };

    case 'VIDEO':
      return {
        ...basePost,
        content: {
          media: {
            title: media[0]?.title || 'Video',
            id: media[0]?.assetUrn,
          },
        },
      };

    default:
      return basePost;
  }
}

// Helper: Create and publish post to LinkedIn
const createAndPublishPost = (
  text: string,
  mediaAssets: LinkedInMediaAsset[],
  profile: LinkedInProfile,
  isOrg?: boolean
): ResultAsync<LinkedInPostResponse, SocialProviderError> => {
  const authorUrn = isOrg
    ? `urn:li:organization:${profile.profileId}`
    : `urn:li:person:${profile.profileId}`;

  // Determine content type based on media
  let contentType: PostContentType;
  if (mediaAssets.length === 0) {
    contentType = 'TEXT_ONLY';
  } else if (mediaAssets[0].type === 'VIDEO') {
    contentType = 'VIDEO';
  } else if (mediaAssets.length === 1) {
    contentType = 'SINGLE_IMAGE';
  } else {
    contentType = 'MULTI_IMAGE';
  }

  const postData = buildLinkedInPostData(
    authorUrn,
    text,
    mediaAssets,
    contentType
  );

  return ResultAsync.fromPromise(
    axios.post('https://api.linkedin.com/rest/posts', postData, {
      headers: {
        Authorization: `Bearer ${profile.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202501',
      },
    }),
    (error: unknown) => {
      return createAPIError('LinkedIn', error);
    }
  ).map((response) => {
    // The new API returns the post ID in the x-restli-id header
    const postId = response.headers['x-restli-id'] || response.data?.id;

    return { id: postId };
  });
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
      profile.profileId,
      profile.accessToken
    ).andThen((assetUrn) => {
      // Wait for video processing to complete before proceeding
      return waitForVideoProcessing(assetUrn, profile.accessToken).map(() => [
        {
          assetUrn,
          type: 'VIDEO' as const,
          title: video.altText || 'Video',
          description: 'Video description',
        },
      ]);
    });
  } else if (imageMedia.length > 0) {
    // Support multiple images
    uploadPromise = ResultAsync.combine(
      imageMedia.map((img) =>
        uploadImageToLinkedIn(img.url!, profile.profileId, profile.accessToken)
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
      platformId: profile.profileId,
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
