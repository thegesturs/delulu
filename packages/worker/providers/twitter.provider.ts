import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { convex } from '@delulu/database/node';
import {
  type MediaType,
  getFileType,
  getValidMediaUrls,
} from '@delulu/validators/post';
import axios from 'axios';
import { ResultAsync, err, errAsync, ok, okAsync } from 'neverthrow';
import { Client, auth } from 'twitter-api-sdk';
import { keys } from '../key';
import type { PostContent, PostPublishResult } from './common-types';
import {
  APIError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
  MediaUploadError,
  NetworkError,
  NoContentError,
  PostCreationError,
  ProfileNotFoundError,
  type SocialProviderError,
  TwitterError,
  createAPIError,
} from './errors';
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
 * Interface for Twitter profile data
 */
interface TwitterProfileData {
  id: string;
  accessToken: string;
  refreshToken?: string;
  username?: string;
  expiresIn?: Date;
}

/**
 * Get Twitter profile from database with decrypted tokens
 */
const getProfile = (
  socialProviderId: string
): ResultAsync<TwitterProfileData, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<'socialProviders'>,
    }),
    () => new TwitterError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken) {
      return err(new ProfileNotFoundError('Twitter'));
    }
    return ok({
      id: profile._id,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken || undefined,
      username: profile.username || undefined,
      expiresIn: profile.expiresIn ? new Date(profile.expiresIn) : undefined,
    });
  });

/**
 * Refresh Twitter access token if expired
 */
const refreshAccessToken = (
  profile: TwitterProfileData
): ResultAsync<TwitterProfileData, SocialProviderError> => {
  if (!profile.expiresIn || !profile.refreshToken) {
    return okAsync(profile);
  }

  if (profile.expiresIn > new Date()) {
    return okAsync(profile);
  }

  const bearerToken = Buffer.from(
    `${keys().TWITTER_CLIENT_ID}:${keys().TWITTER_CLIENT_SECRET}`
  ).toString('base64');

  return ResultAsync.fromPromise(
    fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${bearerToken}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: profile.refreshToken,
      }),
    }),
    (_error) => new NetworkError('Twitter', 'token refresh')
  )
    .andThen((response) => {
      if (!response.ok) {
        return errAsync(
          new APIError('Twitter', response.status, 'Token refresh failed')
        );
      }
      return ResultAsync.fromPromise(
        response.json() as Promise<{
          access_token: string;
          refresh_token: string;
          expires_in: number;
        }>,
        (_error) => new TwitterError('Failed to parse token response')
      );
    })
    .andThen((data) => {
      const updatedProfile = {
        ...profile,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: new Date(Date.now() + data.expires_in * 1000),
      };

      return ResultAsync.fromPromise(
        convex.mutation(api.social_providers.updateSocialProvider, {
          id: profile.id as Id<'socialProviders'>,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: Date.now() + data.expires_in * 1000,
        }),
        () => new TwitterError('Failed to update token in database')
      ).map(() => updatedProfile);
    });
};

/**
 * Validate and sort tweets by order
 */
const validateAndSortTweets = (
  content: PostContent[]
): ResultAsync<Tweet[], SocialProviderError> => {
  if (!content.length) {
    return errAsync(new NoContentError('Twitter'));
  }

  const tweets: Tweet[] = content
    .map((tweet) => ({
      text: tweet.text,
      media: tweet.media,
      order: tweet.order,
    }))
    .sort((a, b) => a.order - b.order);

  return okAsync(tweets);
};

/**
 * Upload media to Twitter
 */
const uploadMediaToTwitter = (
  fileUrl: string,
  profileId: string,
  accessToken: string
): ResultAsync<string, SocialProviderError> => {
  // Download the file
  const downloadFile = (): ResultAsync<
    { buffer: Buffer; mimeType: string },
    SocialProviderError
  > =>
    ResultAsync.fromPromise(
      axios({
        method: 'get',
        url: fileUrl,
        responseType: 'arraybuffer',
      }),
      (error) => createAPIError('Twitter', error)
    ).map((response) => ({
      buffer: Buffer.from(response.data),
      mimeType: getFileType(fileUrl),
    }));

  // Get media category based on file type
  const getMediaCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) {
      return mimeType === 'image/gif' ? 'tweet_gif' : 'tweet_image';
    }
    if (mimeType.startsWith('video/')) {
      return 'amplify_video';
    }
    return 'tweet_image';
  };

  // Initialize media upload
  const initializeUpload = (
    totalBytes: number,
    mimeType: string,
    mediaCategory: string
  ): ResultAsync<{ mediaId: string }, SocialProviderError> => {
    const payload = {
      total_bytes: totalBytes,
      media_type: mimeType,
      media_category: mediaCategory,
      additional_owners: [profileId],
      shared: true,
    };

    return ResultAsync.fromPromise(
      fetch('https://api.twitter.com/2/media/upload/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
      (_error) => new NetworkError('Twitter', 'media upload initialization')
    )
      .andThen((response) => {
        if (!response.ok) {
          return errAsync(
            new APIError(
              'Twitter',
              response.status,
              'Media upload initialization failed'
            )
          );
        }
        return ResultAsync.fromPromise(
          response.json() as Promise<{ data: { id: string } }>,
          (_error) =>
            new TwitterError('Failed to parse upload initialization response')
        );
      })
      .andThen((data) => {
        if (!data.data?.id) {
          return err(new MediaUploadError('Twitter', 'IMAGE'));
        }
        return ok({ mediaId: data.data.id });
      });
  };

  // Upload file chunks
  const uploadChunks = (
    mediaId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): ResultAsync<void, SocialProviderError> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

    const uploadChunk = (
      segmentIndex: number
    ): ResultAsync<void, SocialProviderError> => {
      const start = segmentIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);

      const formData = new FormData();
      formData.append('command', 'APPEND');
      formData.append('media_id', mediaId);
      formData.append('segment_index', segmentIndex.toString());
      formData.append('media', new Blob([chunk], { type: mimeType }));

      return ResultAsync.fromPromise(
        fetch('https://api.x.com/2/media/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }),
        (_error) => new NetworkError('Twitter', 'chunk upload')
      ).andThen((response) => {
        if (!response.ok) {
          return errAsync(
            new APIError(
              'Twitter',
              response.status,
              `Chunk upload failed for segment ${segmentIndex}`
            )
          );
        }
        return okAsync(undefined);
      });
    };

    const uploadAllChunks = async (): Promise<void> => {
      for (let i = 0; i < totalChunks; i++) {
        const result = await uploadChunk(i);
        if (result.isErr()) {
          throw result.error;
        }
      }
    };

    return ResultAsync.fromPromise(
      uploadAllChunks(),
      (error) => error as SocialProviderError
    );
  };

  // Finalize upload
  const finalizeUpload = (
    mediaId: string
  ): ResultAsync<{ processingRequired: boolean }, SocialProviderError> => {
    const formData = new FormData();
    formData.append('command', 'FINALIZE');
    formData.append('media_id', mediaId);

    return ResultAsync.fromPromise(
      fetch('https://api.x.com/2/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }),
      (_error) => new NetworkError('Twitter', 'media finalization')
    )
      .andThen((response) => {
        if (!response.ok) {
          return errAsync(
            new APIError(
              'Twitter',
              response.status,
              'Media finalization failed'
            )
          );
        }
        return ResultAsync.fromPromise(
          response.json() as Promise<{
            data: { processing_info?: { state: string } };
          }>,
          (_error) => new TwitterError('Failed to parse finalization response')
        );
      })
      .map((data) => ({
        processingRequired: !!data.data.processing_info,
      }));
  };

  // Wait for processing completion
  const waitForProcessing = (
    mediaId: string
  ): ResultAsync<void, SocialProviderError> => {
    const checkStatus = (): ResultAsync<
      { isComplete: boolean; hasError: boolean; errorMessage?: string },
      SocialProviderError
    > => {
      const params = new URLSearchParams({
        command: 'STATUS',
        media_id: mediaId,
      });

      return ResultAsync.fromPromise(
        fetch(`https://api.x.com/2/media/upload?${params.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        (_error) => new NetworkError('Twitter', 'status check')
      )
        .andThen((response) => {
          if (!response.ok) {
            return errAsync(
              new APIError('Twitter', response.status, 'Status check failed')
            );
          }
          return ResultAsync.fromPromise(
            response.json() as Promise<{
              data: {
                processing_info?: {
                  state: string;
                  error?: { message: string };
                };
              };
            }>,
            (_error) => new TwitterError('Failed to parse status response')
          );
        })
        .map((data) => {
          const processingInfo = data.data.processing_info;
          if (!processingInfo) {
            return { isComplete: true, hasError: false };
          }

          switch (processingInfo.state) {
            case 'succeeded':
              return { isComplete: true, hasError: false };
            case 'failed':
              return {
                isComplete: true,
                hasError: true,
                errorMessage: processingInfo.error?.message,
              };
            default:
              return { isComplete: false, hasError: false };
          }
        });
    };

    const poll = async (attempts: number): Promise<void> => {
      const maxAttempts = 30;
      const interval = 10000; // 10 seconds

      if (attempts >= maxAttempts) {
        throw new MediaProcessingTimeoutError('Twitter');
      }

      const statusResult = await checkStatus();
      if (statusResult.isErr()) {
        throw statusResult.error;
      }

      const status = statusResult.value;

      if (status.isComplete) {
        if (status.hasError) {
          throw new MediaProcessingError('Twitter', status.errorMessage);
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      return poll(attempts + 1);
    };

    return ResultAsync.fromPromise(
      poll(0),
      (error) => error as SocialProviderError
    );
  };

  // Main upload flow
  return downloadFile().andThen(({ buffer, mimeType }) => {
    const mediaCategory = getMediaCategory(mimeType);
    return initializeUpload(buffer.length, mimeType, mediaCategory).andThen(
      ({ mediaId }) =>
        uploadChunks(mediaId, buffer, mimeType)
          .andThen(() => finalizeUpload(mediaId))
          .andThen(({ processingRequired }) => {
            if (processingRequired) {
              return waitForProcessing(mediaId).map(() => mediaId);
            }
            return okAsync(mediaId);
          })
    );
  });
};

/**
 * Upload multiple media files for a tweet
 */
const uploadTweetMedia = (
  media: MediaType[],
  profileId: string,
  accessToken: string
): ResultAsync<string[], SocialProviderError> => {
  if (!media.length) {
    return okAsync([]);
  }

  const validMediaUrls = getValidMediaUrls(media.slice(0, 4));
  const uploadPromises = validMediaUrls
    .filter((item) => item.url)
    .map((item) => uploadMediaToTwitter(item.url!, profileId, accessToken));

  return ResultAsync.combine(uploadPromises);
};

/**
 * Post first tweet in thread
 */
const postFirstTweet = (
  tweet: Tweet,
  client: Client,
  profile: TwitterProfileData
): ResultAsync<{ tweetId: string }, SocialProviderError> => {
  return uploadTweetMedia(tweet.media, profile.id, profile.accessToken).andThen(
    (mediaIds) => {
      const tweetData = {
        text: tweet.text,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
      };

      return ResultAsync.fromPromise(
        client.tweets.createTweet(tweetData),
        (error) => createAPIError('Twitter', error)
      ).andThen((response) => {
        if (!response.data?.id) {
          return err(new PostCreationError('Twitter'));
        }
        return ok({ tweetId: response.data.id });
      });
    }
  );
};

/**
 * Post thread replies
 */
const postThreadReplies = (
  tweets: Tweet[],
  client: Client,
  profile: TwitterProfileData,
  replyToTweetId: string
): ResultAsync<void, SocialProviderError> => {
  if (!tweets.length) {
    return okAsync(undefined);
  }

  const postReplies = async (currentReplyToId: string): Promise<void> => {
    let replyId = currentReplyToId;

    for (const tweet of tweets) {
      const mediaResult = await uploadTweetMedia(
        tweet.media,
        profile.id,
        profile.accessToken
      );
      if (mediaResult.isErr()) {
        throw mediaResult.error;
      }

      const mediaIds = mediaResult.value;
      const tweetData = {
        text: tweet.text,
        reply: { in_reply_to_tweet_id: replyId },
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
      };

      const replyResult = await ResultAsync.fromPromise(
        client.tweets.createTweet(tweetData),
        (error) => createAPIError('Twitter', error)
      );

      if (replyResult.isErr()) {
        throw replyResult.error;
      }

      if (!replyResult.value.data?.id) {
        continue; // Skip failed replies but continue with thread
      }

      replyId = replyResult.value.data.id;
    }
  };

  return ResultAsync.fromPromise(
    postReplies(replyToTweetId),
    (error) => error as SocialProviderError
  );
};

/**
 * Publish Twitter thread
 */
const publishTwitterThread = (
  tweets: Tweet[],
  profile: TwitterProfileData,
  postId: string
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const client = new Client(profile.accessToken);

  return postFirstTweet(tweets[0], client, profile).andThen(({ tweetId }) =>
    postThreadReplies(tweets.slice(1), client, profile, tweetId).map(() => ({
      platformPostId: tweetId,
      postId,
      platformId: profile.id,
      platformPostUrl: `https://x.com/${profile.username ?? 'unknown'}/status/${tweetId}`,
      postedAt: new Date(),
    }))
  );
};

/**
 * Generate Twitter OAuth URL
 */
const generateConnectUrl = (): string => {
  try {
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
  } catch {
    throw new TwitterError('Failed to generate OAuth URL');
  }
};

/**
 * Main Twitter provider implementation
 */
export const twitterProvider: SocialProvider = {
  /**
   * Publishes content to Twitter, supporting multiple tweets (thread) with media attachments
   */
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId)
      .andThen((profile) => refreshAccessToken(profile))
      .andThen((profile) =>
        validateAndSortTweets(content.content).andThen((tweets) =>
          publishTwitterThread(tweets, profile, content.postId)
        )
      );

    return result;
  },

  connectUrl: () => generateConnectUrl(),
};
