import { keys } from '@/keys';
import { database } from '@delulu/database';
import {
  type MediaType,
  type PostReturnType,
  getFileType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { Client, auth } from 'twitter-api-sdk';
import type { SocialProvider } from './types';

/**
 * Interface for a tweet in the thread
 */
interface Tweet {
  text: string;
  media: MediaType[];
  order: number;
}

/**
 * Interface for the response of a posted tweet
 */

export const twitterProvider: SocialProvider = {
  /**
   * Publishes content to Twitter, supporting multiple tweets (thread) with media attachments
   * @param content - The content to be published, containing an array of tweets with text and media
   * @param socialProviderId - The ID of the social provider to use for authentication
   * @returns Promise<TweetResponse> - Information about the first tweet in the thread
   * @throws {TRPCError} - If authentication fails or if there's an error posting to Twitter
   */
  publish: async ({ content, socialProviderId }): Promise<PostReturnType> => {
    const profile = await getAccessTokenAndProfile(socialProviderId);
    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Social provider not found',
      });
    }

    const client = new Client(profile.accessToken);
    const tweets = sortTweets(content.content);

    if (!tweets.length) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No content to publish',
      });
    }

    try {
      const firstTweetResult = await postFirstTweet(tweets[0], client, profile);
      await postThreadReplies(
        tweets.slice(1),
        client,
        profile,
        firstTweetResult.tweetId
      );

      return {
        platformPostId: firstTweetResult.tweetId,
        postId: content.id ?? '',
        platformId: profile.id,
        platformPostUrl: `https://x.com/${profile.username ?? 'unknown'}/status/${firstTweetResult.tweetId}`,
        postedAt: new Date(),
      };
    } catch (error) {
      console.error('Error posting thread to Twitter:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to post thread to Twitter',
        cause: error,
      });
    }
  },

  connectUrl: () => {
    const authClient = new auth.OAuth2User({
      client_id: keys().TWITTER_CLIENT_ID,
      client_secret: keys().TWITTER_CLIENT_SECRET,
      callback: keys().TWITTER_CALLBACK_URL,
      scopes: ['users.read', 'tweet.read', 'offline.access', 'tweet.write'],
    });
    const url = authClient.generateAuthURL({
      state: keys().TWITTER_STATE,
      code_challenge_method: 'plain',
      code_challenge: 'challenge',
    });
    return url;
  },
};

/**
 * Sorts tweets by their order property
 * @param tweets - Array of tweets to sort
 * @returns Sorted array of tweets
 */
function sortTweets(
  tweets: Array<{ text: string; media: MediaType[]; order: number }>
): Tweet[] {
  return tweets
    .map((tweet) => ({
      text: tweet.text,
      media: tweet.media,
      order: tweet.order,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Uploads media files for a tweet
 * @param media - Array of media objects containing URLs
 * @param profileId - Twitter profile ID
 * @param accessToken - Twitter access token
 * @returns Array of media IDs
 */
async function uploadTweetMedia(
  media: MediaType[],
  profileId: string,
  accessToken: string
): Promise<string[]> {
  const mediaIds: string[] = [];
  if (!media.length) {
    return mediaIds;
  }

  const validMediaUrls = getValidMediaUrls(media.slice(0, 4));
  for (const mediaItem of validMediaUrls) {
    if (mediaItem.url) {
      try {
        const mediaId = await uploadMediaToTwitter(
          mediaItem.url,
          profileId,
          accessToken
        );
        mediaIds.push(mediaId);
      } catch (error) {
        console.error('Failed to upload media:', error);
      }
    }
  }
  return mediaIds;
}

/**
 * Posts the first tweet of a thread
 * @param tweet - The tweet content and media
 * @param client - Twitter API client
 * @param profile - Twitter profile information
 * @returns Object containing the tweet ID
 */
async function postFirstTweet(
  tweet: Tweet,
  client: Client,
  profile: { id: string; accessToken: string }
): Promise<{ tweetId: string }> {
  const mediaIds = await uploadTweetMedia(
    tweet.media,
    profile.id,
    profile.accessToken
  );

  const response = await client.tweets.createTweet({
    text: tweet.text,
    ...(mediaIds.length > 0 && {
      media: { media_ids: mediaIds },
    }),
  });

  if (!response.data) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create first tweet',
    });
  }

  return { tweetId: response.data.id };
}

/**
 * Posts the remaining tweets as replies in the thread
 * @param tweets - Array of remaining tweets to post
 * @param client - Twitter API client
 * @param profile - Twitter profile information
 * @param replyToTweetId - ID of the tweet to reply to
 */
async function postThreadReplies(
  tweets: Tweet[],
  client: Client,
  profile: { id: string; accessToken: string },
  replyToTweetId: string
): Promise<void> {
  let currentReplyToId = replyToTweetId;

  for (const tweet of tweets) {
    const mediaIds = await uploadTweetMedia(
      tweet.media,
      profile.id,
      profile.accessToken
    );

    const replyResponse = await client.tweets.createTweet({
      text: tweet.text,
      reply: {
        in_reply_to_tweet_id: currentReplyToId,
      },
      ...(mediaIds.length > 0 && {
        media: { media_ids: mediaIds },
      }),
    });

    if (!replyResponse.data) {
      console.error('Failed to create reply tweet in thread');
      continue;
    }

    currentReplyToId = replyResponse.data.id;
  }
}

// Helper Functions

async function getAccessTokenAndProfile(tokenId: string) {
  const token = await database.socialProvider.findUnique({
    where: {
      id: tokenId,
    },
  });
  if (!token) {
    throw new Error('Token not found');
  }
  if (token.expiresIn && token.refreshToken && token.accessToken) {
    if (token.expiresIn < new Date()) {
      const bearerToken = Buffer.from(
        `${token.clientId}:${token.clientSecret}`
      ).toString('base64');
      try {
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${bearerToken}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken,
          }),
        });

        const data = (await response.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        if (data) {
          await database.socialProvider.update({
            where: {
              id: tokenId,
            },
            data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: new Date(Date.now() + data.expires_in * 1000),
              updatedAt: new Date(),
              lastSyncedAt: new Date(),
            },
          });
        }
        return { ...token, accessToken: data.access_token };
      } catch (err) {
        // await database.socialProvider.update({
        //   where: {
        //     id: tokenId,
        //   },
        //   data: {

        //   },
        // });
        console.error(err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refresh access token',
        });
      }
    } else {
      return token;
    }
  }
}

// Media upload types
interface MediaUploadInitResponse {
  data: {
    id: string;
    media_key: string;
    expires_after_secs: number;
    processing_info?: {
      state: 'pending' | 'in_progress' | 'succeeded' | 'failed';
      check_after_secs?: number;
      progress_percent?: number;
    };
    size?: number;
  };
  errors?: Array<{
    detail: string;
    status: number;
    title: string;
    type: string;
  }>;
}

interface MediaUploadStatusResponse {
  data: {
    id: string;
    media_key: string;
    expires_after_secs: number;
    processing_info?: {
      state: 'pending' | 'in_progress' | 'succeeded' | 'failed';
      check_after_secs?: number;
      progress_percent?: number;
      error?: {
        code: number;
        name: string;
        message: string;
      };
    };
    size?: number;
  };
  errors?: Array<{
    detail: string;
    status: number;
    title: string;
    type: string;
  }>;
}

// Media category mapping based on file type
function getMediaCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    if (mimeType === 'image/gif') {
      return 'tweet_gif';
    }
    return 'tweet_image';
  }
  if (mimeType.startsWith('video/')) {
    return 'tweet_video';
  }
  return 'tweet_image'; // fallback
}

// Chunk size for uploads (5MB chunks recommended)
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadMediaToTwitter(
  fileUrl: string,
  profileId: string,
  accessToken: string
): Promise<string> {
  try {
    // Download the file
    const fileResponse = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'arraybuffer',
    });

    const fileBuffer = Buffer.from(fileResponse.data);
    const mimeType = getFileType(fileUrl);
    const mediaCategory = getMediaCategory(mimeType);

    // Step 1: Initialize upload
    const initResponse = await initializeMediaUpload({
      accessToken,
      totalBytes: fileBuffer.length,
      mediaType: mimeType,
      mediaCategory,
      additionalOwners: [profileId],
    });

    if (initResponse.errors && initResponse.errors.length > 0) {
      throw new Error(
        `Failed to initialize upload: ${initResponse.errors[0].detail}`
      );
    }

    const mediaId = initResponse.data.id;

    // Step 2: Upload file in chunks
    await uploadMediaChunks({
      accessToken,
      mediaId,
      fileBuffer,
    });

    // Step 3: Finalize upload
    const finalizeResponse = await finalizeMediaUpload({
      accessToken,
      mediaId,
    });

    if (finalizeResponse.errors && finalizeResponse.errors.length > 0) {
      throw new Error(
        `Failed to finalize upload: ${finalizeResponse.errors[0].detail}`
      );
    }

    // Step 4: Check processing status for videos/large files
    if (mediaCategory === 'tweet_video' || mediaCategory === 'tweet_gif') {
      await waitForProcessingComplete({
        accessToken,
        mediaId,
      });
    }

    return mediaId;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw new Error(
      `Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Initialize media upload
async function initializeMediaUpload({
  accessToken,
  totalBytes,
  mediaType,
  mediaCategory,
  additionalOwners,
}: {
  accessToken: string;
  totalBytes: number;
  mediaType: string;
  mediaCategory: string;
  additionalOwners?: string[];
}): Promise<MediaUploadInitResponse> {
  const response = await fetch(
    'https://api.twitter.com/2/media/upload/initialize',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        total_bytes: totalBytes,
        media_type: mediaType,
        media_category: mediaCategory,
        ...(additionalOwners && { additional_owners: additionalOwners }),
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Initialize upload failed: ${response.status} ${errorText}`
    );
  }

  return response.json() as Promise<MediaUploadInitResponse>;
}

// Upload file in chunks
async function uploadMediaChunks({
  accessToken,
  mediaId,
  fileBuffer,
}: {
  accessToken: string;
  mediaId: string;
  fileBuffer: Buffer;
}): Promise<void> {
  const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

  for (let segmentIndex = 0; segmentIndex < totalChunks; segmentIndex++) {
    const start = segmentIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
    const chunk = fileBuffer.slice(start, end);

    const formData = new FormData();
    formData.append('media', new Blob([chunk]), 'media');
    formData.append('segment_index', segmentIndex.toString());

    const response = await fetch(
      `https://api.twitter.com/2/media/upload/${mediaId}/append`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chunk upload failed for segment ${segmentIndex}: ${response.status} ${errorText}`
      );
    }
  }
}

// Finalize media upload
async function finalizeMediaUpload({
  accessToken,
  mediaId,
}: {
  accessToken: string;
  mediaId: string;
}): Promise<MediaUploadStatusResponse> {
  const response = await fetch(
    `https://api.twitter.com/2/media/upload/${mediaId}/finalize`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Finalize upload failed: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<MediaUploadStatusResponse>;
}

// Wait for media processing to complete
async function waitForProcessingComplete({
  accessToken,
  mediaId,
  maxWaitTime = 300000, // 5 minutes max
}: {
  accessToken: string;
  mediaId: string;
  maxWaitTime?: number;
}): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await getMediaUploadStatus({
      accessToken,
      mediaId,
    });

    if (statusResponse.errors && statusResponse.errors.length > 0) {
      throw new Error(
        `Status check failed: ${statusResponse.errors[0].detail}`
      );
    }

    const processingInfo = statusResponse.data.processing_info;

    if (!processingInfo) {
      // No processing info means it's ready
      return;
    }

    switch (processingInfo.state) {
      case 'succeeded':
        return;
      case 'failed':
        throw new Error(
          `Media processing failed: ${processingInfo.error?.message || 'Unknown error'}`
        );
      case 'pending':
      case 'in_progress': {
        // Wait before checking again
        const waitTime = (processingInfo.check_after_secs || 5) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        break;
      }
      default:
        throw new Error(`Unknown processing state: ${processingInfo.state}`);
    }
  }

  throw new Error('Media processing timeout - took longer than expected');
}

// Get media upload status
async function getMediaUploadStatus({
  accessToken,
  mediaId,
}: {
  accessToken: string;
  mediaId: string;
}): Promise<MediaUploadStatusResponse> {
  const response = await fetch(
    `https://api.twitter.com/2/media/upload?media_id=${mediaId}&command=STATUS`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status check failed: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<MediaUploadStatusResponse>;
}
