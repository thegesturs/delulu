import type { IncomingMessage } from 'node:http';
import https from 'node:https';
import type { Readable } from 'node:stream';
import { database } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import { google } from 'googleapis';
import { nanoid } from 'nanoid';
import { ResultAsync, err, errAsync, ok } from 'neverthrow';

import type {
  PostContent,
  PostPublishResult,
  BaseProviderProfile as YouTubeProfile,
  YouTubeVideoMetadata,
  YouTubeVideoUploadResponse,
} from './common-types';
import {
  InvalidMediaError,
  ProfileNotFoundError,
  type SocialProviderError,
  YouTubeError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Constants for file size limits (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<YouTubeProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    database.query.socialProviders.findFirst({
      where: (socialProviders, { eq }) =>
        eq(socialProviders.id, socialProviderId),
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

// Get video stream from URL
const getVideoStream = (
  url: string
): ResultAsync<Readable, SocialProviderError> =>
  ResultAsync.fromPromise(
    new Promise<Readable>((resolve, reject) => {
      https
        .get(url, (response: IncomingMessage) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Failed to get video stream. Status Code: ${response.statusCode}`
              )
            );
            return;
          }

          const contentLength = Number.parseInt(
            response.headers['content-length'] ?? '0',
            10
          );
          if (contentLength > MAX_FILE_SIZE) {
            reject(
              new Error(
                `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
              )
            );
            return;
          }

          resolve(response);
        })
        .on('error', reject);
    }),
    (error) =>
      error instanceof Error
        ? new InvalidMediaError('YouTube', error.message)
        : createAPIError('YouTube', error)
  );

// Video upload to YouTube with streaming
const uploadVideoToYouTube = (
  accessToken: string,
  videoStream: Readable,
  metadata: YouTubeVideoMetadata
): ResultAsync<YouTubeVideoUploadResponse, SocialProviderError> => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({ version: 'v3', auth });

  return ResultAsync.fromPromise(
    youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          ...metadata.snippet,
          tags: metadata.snippet.tags ?? [],
        },
        status: {
          ...metadata.status,
          madeForKids: false,
        },
      },
      media: {
        body: videoStream,
        mimeType: 'video/mp4',
      },
    }),
    (error): SocialProviderError => {
      if (error instanceof Error && error.message.includes('401')) {
        return new YouTubeError('Invalid YouTube access token');
      }
      return createAPIError('YouTube', error);
    }
  ).andThen((response) => {
    const data = response.data;
    if (!data.id) {
      return err(
        new YouTubeError('Failed to get video ID from YouTube response')
      );
    }

    return ok({
      id: data.id,
      snippet: {
        title: data.snippet?.title ?? metadata.snippet.title,
        description: data.snippet?.description ?? metadata.snippet.description,
        tags: data.snippet?.tags ?? metadata.snippet.tags ?? [],
        categoryId: data.snippet?.categoryId ?? metadata.snippet.categoryId,
        defaultLanguage:
          data.snippet?.defaultLanguage ?? metadata.snippet.defaultLanguage,
        defaultAudioLanguage:
          data.snippet?.defaultLanguage ?? metadata.snippet.defaultLanguage,
      },
      status: {
        uploadStatus: 'processed', // YouTube API doesn't return this directly
        privacyStatus:
          data.status?.privacyStatus ?? metadata.status.privacyStatus,
        license: 'youtube', // Default YouTube license
        embeddable: true,                                     
        publicStatsViewable: true,
      },
    });
  });
};

// Main publish function
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: YouTubeProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
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
    return errAsync(
      new InvalidMediaError('YouTube', 'YouTube Shorts requires a video file')
    );
  }

  return getVideoStream(videoMedia.url)
    .andThen((videoStream) => {
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

      return uploadVideoToYouTube(profile.accessToken, videoStream, metadata);
    })
    .map((uploadResponse) => {
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
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
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
      state: nanoid(),
    });

    return ok(`${baseUrl}?${params}`);
  },
};
