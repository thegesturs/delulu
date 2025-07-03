import { database } from '@delulu/database';
import type { PostReturnType } from '@delulu/validators/post';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import { ok, err, errAsync, ResultAsync } from 'neverthrow';

import type { SocialProvider } from './types';
import {
  ProfileNotFoundError,
  InvalidMediaError,

  createAPIError,
  type SocialProviderError,
  YouTubeError,
} from './errors';

// Types
interface YouTubeProfile {
  id: string;
  accessToken: string;
}

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
    categoryId: string;
    defaultLanguage?: string;
  };
  status: {
    privacyStatus: 'public' | 'private' | 'unlisted';
  };
}

// Profile management
const getProfile = (socialProviderId: string): ResultAsync<YouTubeProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    database.query.socialProviders.findFirst({
      where: (socialProviders, { eq }) => eq(socialProviders.id, socialProviderId),
    }),
    () => new YouTubeError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken) {
      return err(new ProfileNotFoundError('YouTube'));
    }
    return ok({
      id: profile.id,
      accessToken: profile.accessToken,
    });
  });

// Video file download
const downloadVideoFile = (url: string): ResultAsync<Buffer, SocialProviderError> =>
  ResultAsync.fromPromise(
    axios.get(url, { responseType: 'arraybuffer' }),
    (error) => createAPIError('YouTube', error)
  ).map(response => Buffer.from(response.data));

// Video upload to YouTube
const uploadVideoToYouTube = (
  accessToken: string,
  videoFile: Buffer,
  metadata: YouTubeVideoMetadata
): ResultAsync<YouTubeVideoUploadResponse, SocialProviderError> => {
  const uploadUrl = 'https://www.googleapis.com/upload/youtube/v3/videos';
  const params = new URLSearchParams({
    part: 'snippet,status',
    uploadType: 'multipart',
  });

  const boundary = '-------314159265358979323846';
  const metadataJson = JSON.stringify(metadata);

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
    Buffer.from(metadataJson),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Type: video/mp4\r\n\r\n'),
    videoFile,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return ResultAsync.fromPromise(
    axios.post(`${uploadUrl}?${params}`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      maxBodyLength: Number.POSITIVE_INFINITY,
      maxContentLength: Number.POSITIVE_INFINITY,
    }),
    (error) => createAPIError('YouTube', error)
  ).map(response => response.data);
};

// Main publish function
const publishContent = (
  content: { content: Array<{ text: string; media: any[]; tags?: string[] }>; postId: string },
  profile: YouTubeProfile
): ResultAsync<PostReturnType, SocialProviderError> => {
  const firstContent = content.content[0];
  
  if (!firstContent) {
    return errAsync(new InvalidMediaError('YouTube', 'No content to publish'));
  }

  // YouTube Shorts requires video content
  const validMedia = getValidMediaUrls(firstContent.media);
  const videoMedia = validMedia.find(
    (media) => media.mediaType === 'VIDEO' && media.url
  );

  if (!videoMedia?.url) {
    return errAsync(new InvalidMediaError('YouTube', 'YouTube Shorts requires a video file'));
  }

  return downloadVideoFile(videoMedia.url)
    .andThen(videoBuffer => {
      // Prepare metadata for YouTube Shorts
      const metadata: YouTubeVideoMetadata = {
        snippet: {
          title: firstContent.text.slice(0, 100) || 'YouTube Short',
          description: firstContent.text || '',
          tags: firstContent.tags || [],
          categoryId: '24', // Entertainment
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
    .map(uploadResponse => {
      const shortsUrl = `https://www.youtube.com/shorts/${uploadResponse.id}`;

      return {
        platformPostId: uploadResponse.id,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: shortsUrl,
        postedAt: new Date(),
      };
    });
};

// Provider implementation
export const youtubeProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId)
      .andThen(profile => publishContent(content, profile));
    return result;
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