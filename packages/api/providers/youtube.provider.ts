import { database } from '@delulu/database';
import type { PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';

import type { SocialProvider } from './types';

interface YouTubeVideoUploadResponse {
  id: string;
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    categoryId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  status: {
    uploadStatus: string;
    privacyStatus: string;
    license: string;
    embeddable: boolean;
    publicStatsViewable: boolean;
  };
}

interface YouTubeVideoMetadata {
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    categoryId: string; // "22" for People & Blogs, "24" for Entertainment
    defaultLanguage?: string;
  };
  status: {
    privacyStatus: 'public' | 'private' | 'unlisted';
  };
}

async function uploadVideoToYouTube(
  accessToken: string,
  videoFile: Buffer | string,
  metadata: YouTubeVideoMetadata
): Promise<YouTubeVideoUploadResponse> {
  const uploadUrl = 'https://www.googleapis.com/upload/youtube/v3/videos';

  // For Shorts, we need to ensure video is ≤60 seconds and vertical/square aspect ratio
  const params = new URLSearchParams({
    part: 'snippet,status',
    uploadType: 'multipart',
  });

  const boundary = '-------314159265358979323846';

  // Create multipart form data
  const metadataJson = JSON.stringify(metadata);
  const videoData =
    typeof videoFile === 'string'
      ? Buffer.from(videoFile, 'base64')
      : videoFile;

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
    Buffer.from(metadataJson),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Type: video/mp4\r\n\r\n'),
    videoData,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const response = await axios.post(`${uploadUrl}?${params}`, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': body.length.toString(),
    },
    maxBodyLength: Number.POSITIVE_INFINITY,
    maxContentLength: Number.POSITIVE_INFINITY,
  });

  return response.data;
}

async function getAccessTokenAndProfile(socialProviderId: string) {
  const profile = await database.socialProvider.findUnique({
    where: {
      id: socialProviderId,
    },
  });

  if (!profile || !profile.accessToken) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'YouTube profile not found or access token is missing.',
    });
  }

  return profile;
}

export const youtubeProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await getAccessTokenAndProfile(socialProviderId);
    const firstContent = content.content[0];

    if (!firstContent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish.',
      });
    }

    // YouTube Shorts requires video content
    const validMedia = getValidMediaUrls(firstContent.media);
    const videoMedia = validMedia.find(
      (media) => media.mediaType === 'VIDEO' && media.url
    );

    if (!videoMedia?.url) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'YouTube Shorts requires a video file.',
      });
    }

    try {
      // Download video file
      const videoResponse = await axios.get(videoMedia.url, {
        responseType: 'arraybuffer',
      });
      const videoBuffer = Buffer.from(videoResponse.data);

      // Prepare metadata for YouTube Shorts
      const metadata: YouTubeVideoMetadata = {
        snippet: {
          title: firstContent.text.slice(0, 100) || 'YouTube Short',
          description: firstContent.text || '',
          tags: firstContent.tags || [],
          categoryId: '24',
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus: 'public',
        },
      };

      // Add #Shorts to description to help YouTube identify it as a Short
      if (!metadata.snippet.description.includes('#Shorts')) {
        metadata.snippet.description += '\n\n#Shorts';
      }

      const uploadResponse = await uploadVideoToYouTube(
        profile.accessToken,
        videoBuffer,
        metadata
      );

      // const videoUrl = `https://www.youtube.com/watch?v=${uploadResponse.id}`;
      const shortsUrl = `https://www.youtube.com/shorts/${uploadResponse.id}`;

      return {
        platformPostId: uploadResponse.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: shortsUrl,
        postedAt: new Date(),
        // metadata: {
        //   videoUrl,
        //   shortsUrl,
        //   uploadStatus: uploadResponse.status.uploadStatus,
        //   privacyStatus: uploadResponse.status.privacyStatus,
        // },
      };
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('YouTube API Error:', error.response.data);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload video to YouTube Shorts',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.YOUTUBE_CALLBACK_URL!,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: 'youtube_oauth_state',
    });

    return `${baseUrl}?${params}`;
  },
};
