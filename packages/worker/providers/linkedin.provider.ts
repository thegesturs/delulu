import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow';
import { keys } from '../key';
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
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new LinkedInError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId) {
      return err(new ProfileNotFoundError('LinkedIn'));
    }

    const linkedinProfile = {
      id: profile._id,
      accessToken: profile.accessToken,
      profileId: profile.profileId,
      username: profile.username!,
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
            'LinkedIn-Version': '202507', // Current version in YYYYMM format
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

// Helper: Validate video specifications for LinkedIn
const validateVideoForLinkedIn = (
  videoBuffer: Buffer,
  videoUrl: string
): ResultAsync<void, SocialProviderError> => {
  const fileSizeBytes = videoBuffer.length;
  const minSize = 75 * 1024; // 75KB
  const maxSize = 500 * 1024 * 1024; // 500MB

  console.log(`[LinkedIn Video] Validating video: ${videoUrl}, size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB`);

  if (fileSizeBytes < minSize) {
    return errAsync(
      new InvalidMediaError(
        'LinkedIn',
        `Video file too small: ${fileSizeBytes} bytes (minimum 75KB)`
      )
    );
  }

  if (fileSizeBytes > maxSize) {
    return errAsync(
      new InvalidMediaError(
        'LinkedIn',
        `Video file too large: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB (maximum 500MB)`
      )
    );
  }

  // Note: We can't validate video length without decoding, but LinkedIn will reject invalid videos
  return okAsync(undefined);
};

// Helper: Split buffer into chunks for upload
const chunkBuffer = (buffer: Buffer, chunkSize: number): Buffer[] => {
  const chunks: Buffer[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.subarray(i, i + chunkSize));
  }
  return chunks;
};

// Helper: Upload video to LinkedIn and return asset URN
const uploadVideoToLinkedIn = (
  videoUrl: string,
  profileId: string,
  accessToken: string,
  isOrg: boolean = false
): ResultAsync<string, SocialProviderError> => {
  console.log(`[LinkedIn Video] Starting video upload: ${videoUrl}`);
  
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
    const videoBuffer = Buffer.from(response.data);
    console.log(`[LinkedIn Video] Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Validate video specifications
    return validateVideoForLinkedIn(videoBuffer, videoUrl).andThen(() => {
      const ownerUrn = isOrg
        ? `urn:li:organization:${profileId}`
        : `urn:li:person:${profileId}`;

      console.log(`[LinkedIn Video] Using owner URN: ${ownerUrn}`);

      // Step 2: Register upload with LinkedIn
      const initializeRequest = {
        initializeUploadRequest: {
          owner: ownerUrn,
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
              'LinkedIn-Version': '202507',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        ),
        (error) => {
          console.log('[LinkedIn Video] Initialize upload failed:', error);
          return createAPIError('LinkedIn', error);
        }
      ).andThen((registerRes) => {
        const uploadInstructions = registerRes.data.value.uploadInstructions;
        const assetUrn = registerRes.data.value.video;
        const uploadToken = registerRes.data.value.uploadToken;

        console.log(`[LinkedIn Video] Upload initialized - Video URN: ${assetUrn}, Upload URLs: ${uploadInstructions.length}`);

        if (!uploadInstructions || uploadInstructions.length === 0) {
          return err(new MediaUploadError('LinkedIn', 'VIDEO'));
        }

        // Step 3: Upload video in chunks (4MB each)
        const chunkSize = 4 * 1024 * 1024; // 4MB
        const chunks = chunkBuffer(videoBuffer, chunkSize);
        console.log(`[LinkedIn Video] Splitting into ${chunks.length} chunks of ~${(chunkSize / 1024 / 1024).toFixed(2)}MB each`);

        const uploadChunks = chunks.map((chunk, index) => {
          const uploadUrl = uploadInstructions[index]?.uploadUrl;
          
          if (!uploadUrl) {
            return errAsync(new MediaUploadError('LinkedIn', 'VIDEO'));
          }

          console.log(`[LinkedIn Video] Uploading chunk ${index + 1}/${chunks.length} (${(chunk.length / 1024 / 1024).toFixed(2)}MB)`);

          return ResultAsync.fromPromise(
            axios.put(uploadUrl, chunk, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/octet-stream',
              },
            }),
            (error) => {
              console.log(`[LinkedIn Video] Chunk ${index + 1} upload failed:`, error);
              return new MediaUploadError('LinkedIn', 'VIDEO');
            }
          ).map((uploadResponse) => {
            const etag = uploadResponse.headers.etag;
            console.log(`[LinkedIn Video] Chunk ${index + 1} uploaded successfully, ETag: ${etag}`);
            return etag;
          });
        });

        return ResultAsync.combine(uploadChunks).andThen((uploadedPartIds) => {
          console.log(`[LinkedIn Video] All chunks uploaded, finalizing upload with ${uploadedPartIds.length} ETags`);

          // Step 4: Finalize the upload
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
                  'LinkedIn-Version': '202507',
                  'X-Restli-Protocol-Version': '2.0.0',
                },
              }
            ),
            (error: unknown) => {
              console.log('[LinkedIn Video] Finalize upload failed:', error);
              return createAPIError('LinkedIn', error);
            }
          ).map(() => {
            console.log(`[LinkedIn Video] Upload finalized successfully: ${assetUrn}`);
            return assetUrn;
          });
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
        'LinkedIn-Version': '202507',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }),
    (error: unknown) => {
      console.log(`[LinkedIn Video] Status check failed for ${videoUrn}:`, error);
      return createAPIError('LinkedIn', error);
    }
  ).map((response) => {
    const status = response.data.status;
    console.log(`[LinkedIn Video] Processing status for ${videoUrn}: ${status}`);
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
  console.log(`[LinkedIn Video] Starting processing wait for ${videoUrn} (max ${maxAttempts} attempts, ${interval / 1000}s intervals)`);
  
  const poll = (attempts: number): ResultAsync<void, SocialProviderError> => {
    if (attempts >= maxAttempts) {
      console.log(`[LinkedIn Video] Processing timeout after ${maxAttempts} attempts for ${videoUrn}`);
      return errAsync(new MediaProcessingTimeoutError('LinkedIn'));
    }

    return checkVideoProcessingStatus(videoUrn, accessToken).andThen(
      (status) => {
        if (status === 'AVAILABLE') {
          console.log(`[LinkedIn Video] Processing completed successfully for ${videoUrn}`);
          return okAsync(undefined);
        }

        if (status === 'PROCESSING_FAILED') {
          console.log(`[LinkedIn Video] Processing failed for ${videoUrn}`);
          return errAsync(
            new MediaProcessingError('LinkedIn', 'Video processing failed')
          );
        }

        if (status === 'PROCESSING' || status === 'WAITING_UPLOAD') {
          console.log(`[LinkedIn Video] Still processing ${videoUrn}, waiting ${interval / 1000}s (attempt ${attempts + 1}/${maxAttempts})`);
          return ResultAsync.fromPromise(
            new Promise((resolve) => setTimeout(resolve, interval)),
            () => new MediaProcessingError('LinkedIn', 'Timeout during wait')
          ).andThen(() => poll(attempts + 1));
        }

        console.log(`[LinkedIn Video] Unknown processing status for ${videoUrn}: ${status}`);
        return errAsync(
          new MediaProcessingError('LinkedIn', `Unknown status: ${status}`)
        );
      }
    );
  };

  return poll(0);
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
        'LinkedIn-Version': '202507',
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

  console.log('[LinkedIn] Processing video media:', videoMedia.length > 0 ? `${videoMedia.length} video(s)` : 'no videos');

  let uploadPromise: ResultAsync<LinkedInMediaAsset[], SocialProviderError>;

  if (videoMedia.length > 0) {
    // Only support one video per post for now
    const video = videoMedia[0];

    uploadPromise = uploadVideoToLinkedIn(
      video.url!,
      profile.profileId,
      profile.accessToken,
      isOrg
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
};
