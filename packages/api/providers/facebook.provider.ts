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
  console.log('📸 Starting photo upload...', { profileId: profile.profileId });

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
    console.log('📸 Making photo upload request to Facebook...');
    const response = await axios.post<FacebookMediaUploadResponse>(
      `${endpoint}?${params.toString()}`
    );
    console.log('📸 Photo upload successful:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('🚨 Error uploading photo to Facebook:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload photo to Facebook',
      cause: error,
    });
  }
}

async function initializeVideoUpload(
  profile: {
    profileId: string;
    accessToken: string;
  },
  isReel = false
): Promise<{ videoId: string; uploadUrl: string }> {
  console.log('🎥 Initializing video upload...', {
    profileId: profile.profileId,
    isReel,
  });
  const endpoint = isReel
    ? `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`
    : `https://graph.facebook.com/v23.0/${profile.profileId}/videos`;

  try {
    console.log('🎥 Making video initialization request to Facebook...');
    const response = await axios.post(endpoint, {
      upload_phase: 'start',
      access_token: profile.accessToken,
    });
    console.log('🎥 Video initialization successful:', response.data);

    if (!response.data.video_id || !response.data.upload_url) {
      throw new Error('Invalid response from video initialization');
    }

    return {
      videoId: response.data.video_id,
      uploadUrl: response.data.upload_url,
    };
  } catch (error) {
    console.error('🚨 Error initializing video upload:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to initialize video upload',
      cause: error,
    });
  }
}

async function uploadVideoContent(
  videoId: string,
  videoUrl: string,
  accessToken: string
): Promise<void> {
  console.log('🎥 Starting video content upload...', { videoUrl, videoId });
  try {
    // Use the correct rupload endpoint with video ID
    const uploadEndpoint = `https://rupload.facebook.com/video-upload/v23.0/${videoId}`;

    console.log('🎥 Uploading video content to:', uploadEndpoint);
    const response = await axios.post(uploadEndpoint, null, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        file_url: videoUrl,
      },
    });

    console.log('🎥 Video content upload response:', response.data);

    if (!response.data.success) {
      throw new Error('Video upload failed - no success response');
    }

    console.log('🎥 Video content upload completed successfully');
  } catch (error) {
    console.error('🚨 Error uploading video content:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
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
  console.log('🎥 Checking video status...', { videoId });
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${videoId}`,
      {
        params: {
          fields: 'status,id,title,description,updated_time',
          access_token: accessToken,
        },
      }
    );
    console.log('🎥 Video status response:', response.data);
    return response.data.status;
  } catch (error) {
    console.error('🚨 Error checking video status:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
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
  description: string,
  isReel = false,
  isInitialProcessing = false
): Promise<string> {
  console.log('🎥 Publishing video...', {
    videoId,
    profileId: profile.profileId,
    isReel,
    phase: isInitialProcessing ? 'processing' : 'publishing',
  });

  try {
    console.log('🎥 Making video publish request...');
    const endpoint = isReel
      ? `https://graph.facebook.com/v23.0/${profile.profileId}/video_reels`
      : `https://graph.facebook.com/v23.0/${profile.profileId}/videos`;

    const response = await axios.post(endpoint, {
      video_id: videoId,
      upload_phase: 'finish',
      video_state: isInitialProcessing ? 'DRAFT' : 'PUBLISHED',
      description: description,
      access_token: profile.accessToken,
    });
    console.log('🎥 Video publish response:', response.data);

    if (!response.data.success) {
      throw new Error('Failed to publish video');
    }

    return videoId;
  } catch (error) {
    console.error('🚨 Error publishing video:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
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
  console.log('📝 Creating feed post...', {
    profileId: profile.profileId,
    mediaIds,
  });
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
    console.log('📝 Making feed post request...');
    const response = await axios.post<FacebookPostResponse>(endpoint, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('📝 Feed post created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('🚨 Error creating Facebook post:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
    }
    throw error;
  }
}

async function getPostDetails(
  postId: string,
  accessToken: string
): Promise<FacebookPostDetails> {
  console.log('📝 Getting post details...', { postId });
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
    console.log('📝 Post details retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('🚨 Error getting Facebook post details:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('🚨 Facebook API Error:', error.response.data);
    }
    throw error;
  }
}

async function getAccessTokenAndProfile(socialProviderId: string) {
  console.log('🔑 Getting access token and profile...', { socialProviderId });
  const [profile] = await database.query.socialProviders.findMany({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
    limit: 1,
  });

  if (!profile || !profile.accessToken || !profile.profileId) {
    console.error('🚨 Profile not found or missing required fields');
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Facebook profile not found or is missing required fields.',
    });
  }
  console.log('🔑 Profile retrieved successfully:', {
    profileId: profile.profileId,
  });
  return profile;
}

export const facebookProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    console.log('🚀 Starting Facebook publish process...', {
      socialProviderId,
    });

    const profile = await getAccessTokenAndProfile(socialProviderId);
    console.log('📝 Retrieved Facebook profile:', {
      profileId: profile.profileId,
    });

    const firstContent = content.content[0];

    if (!firstContent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish.',
      });
    }

    try {
      const validMedia = getValidMediaUrls(firstContent.media);
      console.log('🖼️ Valid media found:', validMedia.length, 'items');
      const mediaIds: string[] = [];

      // Handle media uploads
      for (const media of validMedia) {
        try {
          console.log('📤 Processing media:', {
            type: media.mediaType,
            url: media.url,
          });

          if (media.mediaType === 'VIDEO') {
            console.log('🎥 Starting video upload as reel...');

            // Always post as reel - let Facebook API validate if it meets criteria
            const isReel = true;

            // Initialize video upload
            const { videoId, uploadUrl } = await initializeVideoUpload(
              profile,
              isReel
            );
            console.log('🎥 Video upload initialized:', { videoId });

            // Upload the video content
            console.log('🎥 Uploading video content for video ID:', videoId);
            await uploadVideoContent(videoId, media.url!, profile.accessToken);
            console.log('🎥 Video content uploaded successfully');

            // Poll for video status
            let attempts = 0;
            const maxAttempts = 30; // 5 minutes total
            const pollingInterval = 10000; // 10 seconds

            while (attempts < maxAttempts) {
              console.log('🎥 Checking video status, attempt:', attempts + 1);
              const status = await checkVideoStatus(
                videoId,
                profile.accessToken
              );
              console.log('🎥 Current video status:', status);

              if (
                status.video_status === 'ready' ||
                status.video_status === 'published'
              ) {
                // Video is ready - just add to media IDs, no need to publish again
                console.log('🎥 Video is ready and already published as reel');
                mediaIds.push(videoId);
                break;
              }

              // Add handling for upload_complete state
              if (
                status.video_status === 'upload_complete' &&
                status.uploading_phase?.status === 'complete' &&
                status.processing_phase?.status === 'not_started'
              ) {
                console.log('🎥 Upload complete, initiating processing...');
                await publishVideo(
                  profile,
                  videoId,
                  firstContent.text,
                  isReel,
                  true
                );
                console.log('🎥 Processing initiated');
                // Don't break here, continue polling for final status
              }

              if (status.processing_phase?.error) {
                console.error(
                  '🚨 Video processing error:',
                  status.processing_phase.error
                );
                throw new Error(
                  `Video processing failed: ${status.processing_phase.error.message}`
                );
              }

              console.log('🎥 Waiting for video processing...');
              await new Promise((resolve) =>
                setTimeout(resolve, pollingInterval)
              );
              attempts++;
            }

            if (attempts >= maxAttempts) {
              console.error('🚨 Video processing timeout');
              throw new Error('Video processing timed out');
            }
          } else {
            console.log('🖼️ Uploading photo...');
            const photoId = await uploadPhoto(media, profile);
            console.log('🖼️ Photo uploaded successfully:', photoId);
            mediaIds.push(photoId);
          }
        } catch (error) {
          console.error('🚨 Failed to upload media:', error);
          // Re-throw the error to stop the entire process
          throw error;
        }
      }

      // Check if we have reels (videos) - reels are standalone and don't need feed posts
      const hasReels = validMedia.some((media) => media.mediaType === 'VIDEO');

      if (hasReels && mediaIds.length > 0) {
        // Reels are already published, return reel info
        console.log(
          '🎥 Reel published successfully, no additional feed post needed'
        );
        return {
          platformPostId: mediaIds[0], // Use the video/reel ID
          postId: content.postId,
          platformId: profile.id,
          platformPostUrl: `https://www.facebook.com/${profile.profileId}/videos/${mediaIds[0]}`,
          postedAt: new Date(),
        };
      }
      // Create regular feed post for photos/text only
      console.log('📝 Creating feed post with media IDs:', mediaIds);
      const postResponse = await createFeedPost(
        profile,
        firstContent.text,
        mediaIds
      );
      console.log('📝 Feed post created:', postResponse);

      const postDetails = await getPostDetails(
        postResponse.id,
        profile.accessToken
      );
      console.log('📝 Post details retrieved:', postDetails);

      return {
        platformPostId: postResponse.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: postDetails.permalink_url,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('🚨 Error posting to Facebook:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('🚨 Facebook API Error:', error.response.data);
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
