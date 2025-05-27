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
  status: 'READY';
  description: {
    text: string;
  };
  media: string;
  title: {
    text: string;
  };
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
      const mediaAssets = await uploadMediaAssets(firstContent.media, profile);
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
        postId: content.id ?? '',
        platformId: socialProviderId,
        platformPostUrl: `https://www.linkedin.com/feed/update/${response.id}`,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting to LinkedIn:', error);
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

  for (const mediaItem of validMediaUrls) {
    if (!mediaItem.url) continue;

    try {
      const uploadResponse = await uploadMediaToLinkedIn({
        authToken: profile.accessToken,
        fileUrl: mediaItem.url,
        isImage: mediaItem.mediaType === 'IMAGE',
        profileId: profile.profileId,
      });

      mediaAssets.push({
        status: 'READY',
        description: { text: mediaItem.altText ?? '' },
        media: uploadResponse,
        title: { text: '' },
      });
    } catch (error) {
      console.error('Failed to upload media:', error);
      // Continue with remaining media
    }
  }

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
    ? mediaAssets[0].media.includes('urn:li:image')
      ? 'IMAGE'
      : 'VIDEO'
    : 'NONE';

  return {
    author: `urn:li:person:${profileId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: mediaCategory,
        ...(hasMedia && { media: mediaAssets }),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };
}

/**
 * Uploads a single media file to LinkedIn
 * @param params - Upload parameters including auth token, file URL, and profile ID
 * @returns Promise<string> - The URN of the uploaded media
 */
async function uploadMediaToLinkedIn({
  authToken,
  fileUrl,
  isImage,
  profileId,
}: {
  authToken: string;
  fileUrl: string;
  isImage: boolean;
  profileId: string;
}): Promise<string> {
  try {
    // First, register the media upload
    const registerResponse = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: [
            isImage
              ? 'urn:li:digitalmediaRecipe:feedshare-image'
              : 'urn:li:digitalmediaRecipe:feedshare-video',
          ],
          owner: `urn:li:person:${profileId}`,
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

    // Download the file from the provided URL
    const fileResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });
    const fileBuffer = Buffer.from(fileResponse.data);

    // Upload the file to LinkedIn
    await axios.put(uploadUrl, fileBuffer, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': isImage ? 'image/jpeg' : 'video/mp4',
      },
    });

    return asset;
  } catch (error) {
    console.error('Error uploading media to LinkedIn:', error);
    throw new Error('Failed to upload media to LinkedIn');
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
