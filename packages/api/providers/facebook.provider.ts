import { keys } from '@delulu/api/keys';
import { database } from '@delulu/database';
import type { MediaType, PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { nanoid } from 'nanoid';

import type { SocialProvider } from './types';

interface FacebookMediaUploadResponse {
  id: string;
  upload_url?: string;
}

interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

interface FacebookPostDetails {
  id: string;
  permalink_url: string;
}

interface FacebookVideoStatus {
  video_status: string;
  uploading_phase?: {
    status: string;
    bytes_transferred?: number;
  };
  processing_phase?: {
    status: string;
    error?: {
      message: string;
    };
  };
  publishing_phase?: {
    status: string;
  };
}

async function uploadPhoto(
  media: MediaType,
  profile: { profileId: string; accessToken: string }
): Promise<string> {
  if (!media.url) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Media URL is required',
    });
  }

  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/photos`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    url: media.url,
    published: 'false',
    temporary: 'true',
  });

  try {
    const response = await axios.post<FacebookMediaUploadResponse>(
      `${endpoint}?${params.toString()}`
    );
    return response.data.id;
  } catch (error) {
    console.error('Error uploading photo to Facebook:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload photo to Facebook',
      cause: error,
    });
  }
}

async function initializeVideoUpload(profile: {
  profileId: string;
  accessToken: string;
}): Promise<{ videoId: string; uploadUrl: string }> {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`;

  try {
    const response = await axios.post(endpoint, {
      upload_phase: 'start',
      access_token: profile.accessToken,
    });

    if (!response.data.video_id || !response.data.upload_url) {
      throw new Error('Invalid response from video initialization');
    }

    return {
      videoId: response.data.video_id,
      uploadUrl: response.data.upload_url,
    };
  } catch (error) {
    console.error('Error initializing video upload:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to initialize video upload',
      cause: error,
    });
  }
}

async function uploadVideoContent(
  uploadUrl: string,
  videoUrl: string,
  accessToken: string
): Promise<void> {
  try {
    // First, get the video file size
    const fileResponse = await axios.head(videoUrl);
    const fileSize = fileResponse.headers['content-length'];

    // Upload using the file URL
    await axios.post(uploadUrl, null, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        file_url: videoUrl,
      },
    });
  } catch (error) {
    console.error('Error uploading video content:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload video content',
      cause: error,
    });
  }
}

async function checkVideoStatus(
  videoId: string,
  accessToken: string
): Promise<FacebookVideoStatus> {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${videoId}`,
      {
        params: {
          fields: 'status',
          access_token: accessToken,
        },
      }
    );
    return response.data.status;
  } catch (error) {
    console.error('Error checking video status:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check video status',
      cause: error,
    });
  }
}

async function publishVideo(
  profile: { profileId: string; accessToken: string },
  videoId: string,
  description: string
): Promise<string> {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`,
      {
        video_id: videoId,
        upload_phase: 'finish',
        video_state: 'PUBLISHED',
        description: description,
        access_token: profile.accessToken,
      }
    );

    if (!response.data.success) {
      throw new Error('Failed to publish video');
    }

    return videoId;
  } catch (error) {
    console.error('Error publishing video:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to publish video',
      cause: error,
    });
  }
}

async function createFeedPost(
  profile: { profileId: string; accessToken: string },
  message: string,
  mediaIds: string[] = []
): Promise<FacebookPostResponse> {
  const endpoint = `https://graph.facebook.com/v23.0/${profile.profileId}/feed`;
  const data: {
    access_token: string;
    message: string;
    attached_media?: Array<{ media_fbid: string }>;
  } = {
    access_token: profile.accessToken,
    message,
  };

  if (mediaIds.length > 0) {
    data.attached_media = mediaIds.map((id) => ({ media_fbid: id }));
  }

  try {
    const response = await axios.post<FacebookPostResponse>(endpoint, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Facebook post:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw error;
  }
}

async function getPostDetails(
  postId: string,
  accessToken: string
): Promise<FacebookPostDetails> {
  try {
    const response = await axios.get<FacebookPostDetails>(
      `https://graph.facebook.com/v23.0/${postId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,permalink_url',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting Facebook post details:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Facebook API Error:', error.response.data);
    }
    throw error;
  }
}

async function getAccessTokenAndProfile(socialProviderId: string) {
  const [profile] = await database.query.socialProviders.findMany({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile || !profile.accessToken || !profile.profileId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Facebook profile not found or is missing required fields.',
    });
  }
  return profile;
}

export const facebookProvider: SocialProvider = {
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
      const mediaIds: string[] = [];

      // Handle media uploads
      for (const media of validMedia) {
        try {
          if (media.mediaType === 'VIDEO') {
            // Initialize video upload
            const { videoId, uploadUrl } = await initializeVideoUpload(profile);

            // Upload the video content
            await uploadVideoContent(
              uploadUrl,
              media.url!,
              profile.accessToken
            );

            // Poll for video status
            let attempts = 0;
            const maxAttempts = 30; // 5 minutes total
            const pollingInterval = 10000; // 10 seconds

            while (attempts < maxAttempts) {
              const status = await checkVideoStatus(
                videoId,
                profile.accessToken
              );

              if (
                status.video_status === 'ready' ||
                status.video_status === 'published'
              ) {
                // Publish the video
                await publishVideo(profile, videoId, firstContent.text);
                mediaIds.push(videoId);
                break;
              }

              if (status.processing_phase?.error) {
                throw new Error(
                  `Video processing failed: ${status.processing_phase.error.message}`
                );
              }

              await new Promise((resolve) =>
                setTimeout(resolve, pollingInterval)
              );
              attempts++;
            }

            if (attempts >= maxAttempts) {
              throw new Error('Video processing timed out');
            }
          } else {
            const photoId = await uploadPhoto(media, profile);
            mediaIds.push(photoId);
          }
        } catch (error) {
          console.error('Failed to upload media:', error);
          // Continue with other media if one fails
        }
      }

      // Create the post with media (if any were successfully uploaded)
      const postResponse = await createFeedPost(
        profile,
        firstContent.text,
        mediaIds
      );

      const postDetails = await getPostDetails(
        postResponse.id,
        profile.accessToken
      );

      return {
        platformPostId: postResponse.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: postDetails.permalink_url,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Facebook API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post to Facebook',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().FACEBOOK_CLIENT_ID,
      redirect_uri: keys().FACEBOOK_CALLBACK_URL,
      response_type: 'code',
      scope: [
        'public_profile',
        'pages_show_list',
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_read_user_engagement',
        'business_management',
        'pages_manage_metadata',
        'publish_video',
        'pages_read_user_content',
        'pages_manage_instant_articles',
        'pages_manage_engagement',
        'pages_messaging',
      ].join(','),
      state: JSON.stringify({ state: nanoid(10) }),
    });

    return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
  },
};
