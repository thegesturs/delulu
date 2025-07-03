import { database as db } from '@delulu/database';
import {
  type MediaType,
  type PostReturnType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { ok, err, type Result } from 'neverthrow';
import { keys } from '../keys';
import type { SocialProvider } from './types';

/**
 * Interface for LinkedIn media upload response
 */
interface LinkedInMediaAsset {
  status: 'READY' | 'PROCESSING' | 'PROCESSING_FAILED' | 'ALLOWED';
  description: {
    text: string;
  };
  media: string;
  title: {
    text: string;
  };
  mediaTypeFamily?: 'STILLIMAGE' | 'VIDEO';
}

/**
 * Interface for LinkedIn post payload using the new Marketing API
 */
interface LinkedInPostPayload {
  author: string;
  commentary: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
  distribution: {
    feedDistribution: 'MAIN_FEED';
    targetEntities?: [];
    thirdPartyDistributionChannels?: [];
  };
  lifecycleState: 'PUBLISHED';
  content?: {
    multiImage?: {
      images: {
        id: string;
        altText?: string;
      }[];
    };
    image?: {
      id: string;
      altText?: string;
    };
    media?: {
      id: string;
      title: string;
      altText?: string;
    };
  };
  isReshare?: boolean;
}

interface LinkedInUploadResult {
  urn: string;
  altText?: string;
  mediaType: 'IMAGE' | 'VIDEO';
}

interface LinkedInVideoSpecs {
  maxSize: number; // 5GB
  formats: string[]; // Supported formats
  aspectRatios: string[]; // Supported aspect ratios
  maxDuration: number; // Maximum duration in seconds
}

const LINKEDIN_VIDEO_SPECS: LinkedInVideoSpecs = {
  maxSize: 5 * 1024 * 1024 * 1024, // 5GB
  formats: ['MP4'],
  aspectRatios: ['16:9', '1:1', '4:5', '9:16'], // LinkedIn supports landscape, square, and vertical
  maxDuration: 10 * 60, // 10 minutes
};

/**
 * Retrieves the access token and profile information for a LinkedIn account
 */
async function getAccessTokenAndProfile(socialProviderId: string): Promise<Result<{ id: string; profileId: string; accessToken: string }, Error>> {
  const [profile] = await db.query.socialProviders.findMany({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile || !profile.accessToken) {
    return err(new Error('LinkedIn profile not found'));
  }

  return ok({
    id: profile.id,
    profileId: profile.profileId || '',
    accessToken: profile.accessToken,
  });
}

/**
 * Uploads media assets to LinkedIn
 */
async function uploadMediaAssets(
  media: MediaType[],
  profile: { accessToken: string; profileId: string }
): Promise<Result<LinkedInUploadResult[], Error>> {
  const uploadedAssets: LinkedInUploadResult[] = [];
  const validMediaUrls = getValidMediaUrls(media);

  console.log('Starting media upload process with:', validMediaUrls);

  for (const mediaItem of validMediaUrls) {
    if (!mediaItem.url) {
      console.log('Skipping media item with no URL');
      continue;
    }

    console.log('Uploading media item:', mediaItem);
    const isImage = mediaItem.mediaType === 'IMAGE';
    const ownerUrn = `urn:li:person:${profile.profileId}`;

    const uploadResult = isImage
      ? await uploadImage({
          authToken: profile.accessToken,
          ownerUrn,
          fileUrl: mediaItem.url,
        })
      : await uploadVideo({
          authToken: profile.accessToken,
          ownerUrn,
          fileUrl: mediaItem.url,
        });

    if (uploadResult.isErr()) {
      return err(uploadResult.error);
    }

    uploadedAssets.push({
      urn: uploadResult.value.urn,
      altText: mediaItem.altText,
      mediaType: mediaItem.mediaType,
    });

    console.log('Upload successful, asset URN:', uploadResult.value.urn);
  }

  console.log('Completed media uploads, total assets:', uploadedAssets.length);
  return ok(uploadedAssets);
}

/**
 * Creates the payload for a LinkedIn post using the new Marketing API
 */
function createPostPayload(
  text: string,
  profileId: string,
  uploadedAssets: LinkedInUploadResult[],
  isOrganization = false
): LinkedInPostPayload {
  const authorUrn = isOrganization
    ? `urn:li:organization:${profileId}`
    : `urn:li:person:${profileId}`;

  const payload: LinkedInPostPayload = {
    author: authorUrn,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
    },
    lifecycleState: 'PUBLISHED',
  };

  if (uploadedAssets.length > 0) {
    if (uploadedAssets.length > 1) {
      // Multi-image post
      payload.content = {
        multiImage: {
          images: uploadedAssets.map((asset) => ({
            id: asset.urn,
            altText: asset.altText,
          })),
        },
      };
    } else {
      // Single media post
      const asset = uploadedAssets[0];
      if (asset.mediaType === 'IMAGE') {
        payload.content = {
          image: { id: asset.urn, altText: asset.altText },
        };
      } else {
        payload.content = {
          media: {
            id: asset.urn,
            title: 'Video Post', // A title is required for videos
            altText: asset.altText,
          },
        };
      }
    }
  }

  return payload;
}

/**
 * Uploads an image to LinkedIn using the new Images API
 */
async function uploadImage({
  authToken,
  ownerUrn,
  fileUrl,
}: {
  authToken: string;
  ownerUrn: string;
  fileUrl: string;
}): Promise<Result<{ urn: string }, Error>> {
  try {
    // 1. Initialize Upload
    const initResponse = await axios.post(
      'https://api.linkedin.com/rest/images?action=initializeUpload',
      { initializeUploadRequest: { owner: ownerUrn } },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'LinkedIn-Version': '202410',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    const { uploadUrl, image: imageUrn } = initResponse.data.value;

    // 2. Upload Image to pre-signed URL
    const imageResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });
    await axios.put(uploadUrl, imageResponse.data, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    // 3. Verify upload (wait for it to be available)
    const waitResult = await waitForAssetReady(imageUrn, authToken, 'image');
    if (waitResult.isErr()) {
      return err(waitResult.error);
    }

    return ok({ urn: imageUrn });
  } catch (error) {
    return err(new Error('Failed to upload image to LinkedIn'));
  }
}

/**
 * Uploads a video to LinkedIn using the new Videos API
 */
async function uploadVideo({
  authToken,
  ownerUrn,
  fileUrl,
}: {
  authToken: string;
  ownerUrn: string;
  fileUrl: string;
}): Promise<Result<{ urn: string }, Error>> {
  try {
    // 1. Initialize Upload
    const initResponse = await axios.post(
      'https://api.linkedin.com/rest/videos?action=initializeUpload',
      {
        initializeUploadRequest: {
          owner: ownerUrn,
          fileSizeBytes: Number.parseInt(
            (await axios.head(fileUrl)).headers['content-length'] ?? '0',
            10
          ),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'LinkedIn-Version': '202410',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    console.log('initResponse', initResponse.data);

    const {
      video: videoUrn,
      uploadInstructions,
      uploadToken,
    } = initResponse.data.value;

    // 2. Upload video parts
    // This example assumes a single part upload for simplicity.
    // For larger files, you'd loop through uploadInstructions.
    const uploadUrl = uploadInstructions[0].uploadUrl;
    const videoResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });
    const uploadPartResponse = await axios.put(uploadUrl, videoResponse.data, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    const etag = uploadPartResponse.headers.etag;
    if (!etag) {
      return err(new Error('Could not get ETag from video upload part.'));
    }

    // 3. Finalize upload
    await axios.post(
      'https://api.linkedin.com/rest/videos?action=finalizeUpload',
      {
        finalizeUploadRequest: {
          video: videoUrn,
          uploadToken,
          uploadedPartIds: [etag.replace(/"/g, '')],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'LinkedIn-Version': '202410',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    // 4. Verify upload
    const waitResult = await waitForAssetReady(videoUrn, authToken, 'video');
    if (waitResult.isErr()) {
      return err(waitResult.error);
    }

    return ok({ urn: videoUrn });
  } catch (error) {
    return err(new Error('Failed to upload video to LinkedIn'));
  }
}

async function waitForAssetReady(
  assetUrn: string,
  authToken: string,
  assetType: 'image' | 'video',
  maxAttempts = 20,
  delayMs = 5000
): Promise<Result<void, Error>> {
  const endpoint = assetType === 'image' ? 'images' : 'videos';
  const id = encodeURIComponent(assetUrn);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(
      `Checking ${assetType} status... Attempt ${attempt + 1}/${maxAttempts}`
    );
    try {
      const response = await axios.get(
        `https://api.linkedin.com/rest/${endpoint}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'LinkedIn-Version': '202410',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      const status = response.data.status;
      console.log(`Asset status: ${status}`);

      if (status === 'AVAILABLE') {
        console.log(`${assetType} is ready.`);
        return ok(undefined);
      }
      if (status === 'FAILED') {
        return err(new Error(`${assetType} processing failed.`));
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      return err(new Error(`Failed to check ${assetType} status`));
    }
  }
  return err(new Error(`${assetType} did not become ready in time.`));
}

/**
 * Publishes a post to LinkedIn using the new Marketing API
 */
async function publishToLinkedIn(
  payload: LinkedInPostPayload,
  accessToken: string
): Promise<Result<{ id: string }, Error>> {
  try {
    const response = await axios.post(
      'https://api.linkedin.com/rest/posts',
      payload,
      {
        headers: {
          'LinkedIn-Version': '202410',
          'X-RestLi-Protocol-Version': '2.0.0',
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // The post ID is in the response headers, not the body
    const postId = response.headers['x-restli-id'];

    if (response.status !== 201 || !postId) {
      console.error('LinkedIn API Error: Failed to get post ID from response.', {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
      return err(new Error('Failed to get post ID from LinkedIn response'));
    }

    return ok({ id: postId });
  } catch (error) {
    return err(new Error('Failed to publish post to LinkedIn'));
  }
}

export const linkedinProvider: SocialProvider = {
  /**
   * Publishes content to LinkedIn, supporting text posts with multiple media attachments
   */
  publish: async ({ content, socialProviderId }) => {
    const profileResult = await getAccessTokenAndProfile(socialProviderId);
    if (profileResult.isErr()) {
      return err(profileResult.error);
    }
    const profile = profileResult.value;

    if (!profile.profileId) {
      return err(new Error('LinkedIn profile ID not found'));
    }

    const firstContent = content.content[0];
    if (!firstContent) {
      return err(new Error('No content to publish'));
    }

    // First upload all media and wait for them to be ready
    const mediaResult = await uploadMediaAssets(firstContent.media, profile);
    if (mediaResult.isErr()) {
      return err(mediaResult.error);
    }
    const mediaAssets = mediaResult.value;
    console.log('Media assets uploaded and ready:', mediaAssets);

    // Only proceed with post creation if all media is ready
    // Detect if this is an organization account from the profileId format
    // LinkedIn organization profileIds are typically numeric, while personal ones are alphanumeric
    const isOrganization = /^\d+$/.test(profile.profileId);

    const postPayload = createPostPayload(
      firstContent.text,
      profile.profileId,
      mediaAssets,
      isOrganization
    );

    const publishResult = await publishToLinkedIn(
      postPayload,
      profile.accessToken
    );

    if (publishResult.isErr()) {
      return err(publishResult.error);
    }

    const response = publishResult.value;

    return ok({
      platformPostId: response.id,
      postId: content.postId,
      platformId: socialProviderId,
      platformPostUrl: `https://www.linkedin.com/feed/update/${response.id}`,
      postedAt: new Date(),
    });
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
    console.log('url', url);
    return ok(url);
  },
};