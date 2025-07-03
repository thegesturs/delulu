import { database } from '@delulu/database';
import type { PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { ok, err, type Result, fromPromise } from 'neverthrow';

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
): Promise<Result<YouTubeVideoUploadResponse, Error>> {
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

  return fromPromise(
    axios.post(`${uploadUrl}?${params}`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      maxBodyLength: Number.POSITIVE_INFINITY,
      maxContentLength: Number.POSITIVE_INFINITY,
    }),
    () => new Error('Failed to upload video to YouTube')
  ).map(response => response.data);
}

async function downloadVideoFile(url: string): Promise<Result<Buffer, Error>> {
  return fromPromise(
    axios.get(url, { responseType: 'arraybuffer' }),
    () => new Error('Failed to download video file')
  ).map(response => Buffer.from(response.data));
}

async function getAccessTokenAndProfile(socialProviderId: string): Promise<Result<{ id: string; accessToken: string }, Error>> {
  const profile = await database.query.socialProviders.findFirst({
    where: (socialProviders, { eq }) =>
      eq(socialProviders.id, socialProviderId),
  });

  if (!profile || !profile.accessToken) {
    return err(new Error('YouTube profile not found or access token is missing.'));
  }

  return ok({
    id: profile.id,
    accessToken: profile.accessToken,
  });
}

export const youtubeProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    return (await getAccessTokenAndProfile(socialProviderId))
      .andThen(profile => {
        const firstContent = content.content[0];

        if (!firstContent) {
          return Promise.resolve(err(new Error('No content to publish.')));
        }

        // YouTube Shorts requires video content
        const validMedia = getValidMediaUrls(firstContent.media);
        const videoMedia = validMedia.find(
          (media) => media.mediaType === 'VIDEO' && media.url
        );

        if (!videoMedia?.url) {
          return Promise.resolve(err(new Error('YouTube Shorts requires a video file.')));
        }

        // Chain operations using neverthrow
        return downloadVideoFile(videoMedia.url)
          .then(videoBufferResult => 
            videoBufferResult.andThen(videoBuffer => {
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

              return uploadVideoToYouTube(profile.accessToken, videoBuffer, metadata);
            })
          )
          .then(uploadResult => 
            uploadResult.map(uploadResponse => {
              const shortsUrl = `https://www.youtube.com/shorts/${uploadResponse.id}`;

              return {
                platformPostId: uploadResponse.id,
                postId: content.postId,
                platformId: profile.id,
                platformPostUrl: shortsUrl,
                postedAt: new Date(),
              };
            })
          );
      });
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

    return ok(`${baseUrl}?${params}`);
  },
};