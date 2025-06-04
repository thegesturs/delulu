import { database } from '@delulu/database';
import {
  type MediaType,
  type PostReturnType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
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
 * Interface for LinkedIn post payload
 */
interface LinkedInPostPayload {
  author: string;
  lifecycleState: 'PUBLISHED';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO';
      media?: LinkedInMediaAsset[];
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC';
  };
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

export const linkedinProvider: SocialProvider = {
  /**
   * Publishes content to LinkedIn, supporting text posts with multiple media attachments
   * @param content - The content to be published, containing text and media
   * @param socialProviderId - The ID of the social provider to use for authentication
   * @returns Promise<PostReturnType> - Information about the published post
   * @throws {TRPCError} - If authentication fails or if there's an error posting to LinkedIn
   */
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await getAccessTokenAndProfile(socialProviderId);
    if (!profile.profileId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'LinkedIn profile ID not found',
      });
    }

    const firstContent = content.content[0];
    if (!firstContent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish',
      });
    }

    try {
      // First upload all media and wait for them to be ready
      const mediaAssets = await uploadMediaAssets(firstContent.media, profile);
      console.log('Media assets uploaded and ready:', mediaAssets);

      // Only proceed with post creation if all media is ready
      const postPayload = createPostPayload(
        firstContent.text,
        profile.profileId,
        mediaAssets
      );

      const response = await publishToLinkedIn(
        postPayload,
        profile.accessToken
      );

      return {
        platformPostId: response.id,
        postId: content.postId,
        platformId: socialProviderId,
        platformPostUrl: `https://www.linkedin.com/feed/update/${response.id}`,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting to LinkedIn:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('LinkedIn API Error:', error.response.data);
        // Check for duplicate content error
        if (
          error.response.status === 422 &&
          error.response.data.message?.includes('duplicate')
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This content has already been posted to LinkedIn',
          });
        }
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to LinkedIn',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${keys().LINKEDIN_CLIENT_ID}&redirect_uri=${keys().LINKEDIN_CALLBACK_URL}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;
    console.log('url', url);
    return url;
  },
};

/**
 * Retrieves the access token and profile information for a LinkedIn account
 * @param socialProviderId - The ID of the social provider
 * @returns Promise containing the profile information and access token
 * @throws {TRPCError} - If the profile is not found
 */
async function getAccessTokenAndProfile(socialProviderId: string) {
  const profile = await database.socialProvider.findUnique({
    where: {
      id: socialProviderId,
    },
  });

  if (!profile || !profile.accessToken) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'LinkedIn profile not found',
    });
  }

  return profile;
}

/**
 * Uploads media assets to LinkedIn
 * @param media - Array of media items to upload
 * @param profile - LinkedIn profile information
 * @returns Promise<LinkedInMediaAsset[]> - Array of uploaded media assets
 */
async function uploadMediaAssets(
  media: MediaType[],
  profile: { accessToken: string; profileId: string }
): Promise<LinkedInMediaAsset[]> {
  const mediaAssets: LinkedInMediaAsset[] = [];
  const validMediaUrls = getValidMediaUrls(media);

  console.log('Starting media upload process with:', validMediaUrls);

  for (const mediaItem of validMediaUrls) {
    if (!mediaItem.url) {
      console.log('Skipping media item with no URL');
      continue;
    }

    try {
      console.log('Uploading media item:', mediaItem);
      const uploadResponse = await uploadMedia({
        authToken: profile.accessToken,
        fileUrl: mediaItem.url,
        isImage: mediaItem.mediaType === 'IMAGE',
        media: { owner: profile.profileId },
      });

      console.log('Upload successful, asset ID:', uploadResponse);
      mediaAssets.push({
        status: 'READY',
        description: { text: mediaItem.altText ?? '' },
        media: uploadResponse.assetId,
        title: { text: '' },
        mediaTypeFamily: uploadResponse.mediaTypeFamily,
      });
      console.log('Added asset to mediaAssets array');
    } catch (error) {
      console.error('Failed to upload media:', error);
      // Instead of silently continuing, we might want to throw the error
      throw error;
    }
  }

  console.log('Completed media uploads, total assets:', mediaAssets.length);
  return mediaAssets;
}

/**
 * Creates the payload for a LinkedIn post
 * @param text - The text content of the post
 * @param profileId - LinkedIn profile ID
 * @param mediaAssets - Array of uploaded media assets
 * @returns LinkedInPostPayload - The formatted payload for the LinkedIn API
 */
function createPostPayload(
  text: string,
  profileId: string,
  mediaAssets: LinkedInMediaAsset[]
): LinkedInPostPayload {
  const hasMedia = mediaAssets.length > 0;
  const mediaCategory = hasMedia
    ? mediaAssets[0].mediaTypeFamily === 'STILLIMAGE'
      ? 'IMAGE'
      : 'VIDEO'
    : 'NONE';

  console.log('mediaCategory', mediaCategory);
  console.log('hasMedia', mediaAssets);

  const mediaAssetWithoutCategory = mediaAssets.map((asset) => {
    return {
      status: asset.status,
      description: asset.description,
      media: asset.media,
      title: asset.title,
    };
  });

  return {
    author: `urn:li:person:${profileId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: mediaCategory,
        ...(hasMedia && { media: mediaAssetWithoutCategory }),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };
}

/**
 * Checks the status of a LinkedIn media asset
 * @param assetId - The ID of the asset to check
 * @param authToken - LinkedIn access token
 * @returns Promise<{ status: 'READY' | 'PROCESSING' | 'PROCESSING_FAILED' | 'ALLOWED', mediaTypeFamily: 'STILLIMAGE' | 'VIDEO' }> - The status of the asset and its media type family
 */
async function checkAssetStatus(
  assetId: string,
  authToken: string
): Promise<{
  status: 'READY' | 'PROCESSING' | 'PROCESSING_FAILED' | 'ALLOWED';
  mediaTypeFamily: 'STILLIMAGE' | 'VIDEO';
}> {
  try {
    const assetIdWithoutPrefix = assetId.replace(
      'urn:li:digitalmediaAsset:',
      ''
    );

    const response = await axios.get(
      `https://api.linkedin.com/v2/assets/${assetIdWithoutPrefix}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.data) {
      console.warn('No data received from LinkedIn asset status check');
      return { status: 'PROCESSING', mediaTypeFamily: 'STILLIMAGE' };
    }

    console.log('Asset status response:', response.data);

    // For videos, we need to check the recipe status
    if (response.data.mediaTypeFamily === 'VIDEO') {
      const recipeStatus = response.data.recipes?.[0]?.status;
      console.log('Video recipe status:', recipeStatus);
      console.log('Video response:', response.data);

      // Handle SERVER_ERROR explicitly
      if (recipeStatus === 'SERVER_ERROR') {
        console.warn('LinkedIn recipe returned SERVER_ERROR — will retry.');
        console.log('Video response:', response.data);
        return { status: 'PROCESSING', mediaTypeFamily: 'VIDEO' };
      }

      // Check for other error statuses or processing state
      if (recipeStatus && recipeStatus !== 'AVAILABLE') {
        if (
          recipeStatus === 'PROCESSING_FAILED' ||
          recipeStatus === 'TRANSCODE_ERROR'
        ) {
          throw new Error(`Video processing failed: ${recipeStatus}`);
        }
        console.log('Video is still processing:', recipeStatus);
        return { status: 'PROCESSING', mediaTypeFamily: 'VIDEO' };
      }
    }

    return {
      status: response.data.status,
      mediaTypeFamily: response.data.mediaTypeFamily,
    };
  } catch (error) {
    console.error('Error checking asset status:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      // If we get a 403 or 404, the asset might still be processing
      if (error.response?.status === 403 || error.response?.status === 404) {
        return { status: 'PROCESSING', mediaTypeFamily: 'STILLIMAGE' };
      }
    }
    throw error;
  }
}

/**
 * Waits for a LinkedIn media asset to become available
 * @param assetId - The ID of the asset to wait for
 * @param authToken - LinkedIn access token
 * @param maxAttempts - Maximum number of attempts to check status
 * @param delayMs - Delay between status checks in milliseconds
 * @returns Promise<{ status: 'READY' | 'PROCESSING' | 'PROCESSING_FAILED' | 'ALLOWED', mediaTypeFamily: 'STILLIMAGE' | 'VIDEO' }> - The status of the asset and its media type family
 */
async function waitForAssetAvailability(
  assetId: string,
  authToken: string,
  maxAttempts = 60,
  delayMs = 5000
): Promise<{
  status: 'READY' | 'PROCESSING' | 'PROCESSING_FAILED' | 'ALLOWED';
  mediaTypeFamily: 'STILLIMAGE' | 'VIDEO';
}> {
  let lastStatus = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Checking asset status attempt ${attempt + 1}/${maxAttempts}`);
    const { status, mediaTypeFamily } = await checkAssetStatus(
      assetId,
      authToken
    );

    // Keep track of last status for better error messaging
    lastStatus = status;

    switch (status) {
      case 'READY':
      case 'ALLOWED':
        console.log(`Asset is ${status}, type: ${mediaTypeFamily}`);
        // For videos, wait a bit longer even after ALLOWED to ensure processing
        if (mediaTypeFamily === 'VIDEO' && attempt < 2) {
          console.log(
            'Video detected, waiting additional time for processing...'
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        return { status, mediaTypeFamily };
      case 'PROCESSING_FAILED':
        throw new Error('Asset processing failed');
      case 'PROCESSING':
        console.log('Asset is still processing, waiting...');
        if (attempt === maxAttempts - 1) {
          throw new Error(
            `Asset processing timeout - took longer than expected. Last status: ${lastStatus}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      default:
        console.error('Unexpected asset status:', status);
        throw new Error(`Unknown asset status: ${status}`);
    }
  }

  throw new Error(
    `Asset processing timeout - took longer than expected. Last status: ${lastStatus}`
  );
}

async function validateVideoForLinkedIn(fileUrl: string): Promise<void> {
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'stream',
      headers: {
        Range: 'bytes=0-0', // Just get the first byte to check if file is accessible
      },
    });

    // Get content type and size from response headers
    const contentType = response.headers['content-type'];
    const contentLength = Number.parseInt(
      response.headers['content-length'] || '0',
      10
    );

    // Check file size
    if (contentLength > LINKEDIN_VIDEO_SPECS.maxSize) {
      throw new Error(`Video file size exceeds LinkedIn's limit of 5GB`);
    }

    // Check content type
    if (!contentType.includes('video/mp4')) {
      throw new Error('LinkedIn only supports MP4 video format');
    }

    console.log('Video validation passed:', {
      size: contentLength,
      type: contentType,
    });
  } catch (error) {
    console.error('Video validation error:', error);
    if (error instanceof Error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Video validation failed: ${error.message}`,
      });
    }
    throw error;
  }
}

/**
 * Uploads media to LinkedIn and waits for it to be ready
 */
async function uploadMedia({
  authToken,
  fileUrl,
  isImage,
  media: { owner },
}: {
  authToken: string;
  fileUrl: string;
  isImage: boolean;
  media: {
    owner: string;
  };
}): Promise<{ assetId: string; mediaTypeFamily: 'STILLIMAGE' | 'VIDEO' }> {
  try {
    // Validate video if not an image
    if (!isImage) {
      console.log('Validating video before upload...');
      await validateVideoForLinkedIn(fileUrl);
    }

    // Step 1: Register the media upload
    console.log(
      `Registering ${isImage ? 'image' : 'video'} upload with LinkedIn...`
    );
    const registerResponse = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: [
            isImage
              ? 'urn:li:digitalmediaRecipe:feedshare-image'
              : 'urn:li:digitalmediaRecipe:feedshare-video',
          ],
          owner: `urn:li:person:${owner}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    const uploadUrl =
      registerResponse.data.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ].uploadUrl;
    const asset = registerResponse.data.value.asset;

    // Step 2: Get the file as a binary buffer
    console.log('Fetching media file...');
    const fileResponse = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
    });

    // Step 3: Upload the file to LinkedIn using POST as per documentation
    console.log('Uploading media to LinkedIn...');
    try {
      await axios.post(uploadUrl, fileResponse.data, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': isImage ? 'image/jpeg' : 'video/mp4',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        maxContentLength: Number.POSITIVE_INFINITY,
        maxBodyLength: Number.POSITIVE_INFINITY,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Upload error response:', error.response?.data);
        if (error.response?.status === 413) {
          throw new TRPCError({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Video file is too large for LinkedIn upload',
          });
        }
      }
      throw error;
    }

    // Step 4: Wait for the asset to be ready and get media type
    console.log('Waiting for LinkedIn to process the media...');
    const { status, mediaTypeFamily } = await waitForAssetAvailability(
      asset,
      authToken,
      isImage ? 60 : 120, // Double the wait time for videos
      isImage ? 5000 : 10000 // Double the check interval for videos
    );

    return {
      assetId: asset,
      mediaTypeFamily,
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    if (error instanceof TRPCError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      if (error.response?.data?.message?.includes('duplicate')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This video has already been uploaded to LinkedIn',
        });
      }
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to upload ${isImage ? 'image' : 'video'}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    });
  }
}

/**
 * Publishes a post to LinkedIn
 * @param payload - The post payload
 * @param accessToken - LinkedIn access token
 * @returns Promise containing the response from LinkedIn
 */
async function publishToLinkedIn(
  payload: LinkedInPostPayload,
  accessToken: string
): Promise<{ id: string }> {
  const response = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    payload,
    {
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.data?.id) {
    throw new Error('Failed to get post ID from LinkedIn response');
  }

  return { id: response.data.id };
}
