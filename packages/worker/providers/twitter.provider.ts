import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { convex } from "@delulu/database/node";
import { getValidMediaUrls, type MediaType } from "@delulu/validators/post";
import { Client, OAuth2 } from "@xdevplatform/xdk";
import axios from "axios";
import { err, errAsync, ok, okAsync, ResultAsync } from "neverthrow";
import { keys } from "../key";
import type { PostContent, PostPublishResult } from "./common-types";
import {
  createAPIError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
  MediaUploadError,
  NetworkError,
  NoContentError,
  PostCreationError,
  ProfileNotFoundError,
  type SocialProviderError,
  TwitterError,
} from "./errors";
import type { SocialProvider } from "./types";

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
 * Get proper MIME type from file URL
 */
const getMimeType = (url: string): string => {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return mimeMap[ext || ""] || "application/octet-stream";
};

/**
 * Get media category based on MIME type
 */
const getMediaCategory = (
  mimeType: string
): "tweet_image" | "tweet_gif" | "tweet_video" => {
  if (mimeType === "image/gif") {
    return "tweet_gif";
  }
  if (mimeType.startsWith("image/")) {
    return "tweet_image";
  }
  if (mimeType.startsWith("video/")) {
    return "tweet_video";
  }
  return "tweet_image";
};

/**
 * Get Twitter profile from database with decrypted tokens
 */
const getProfile = (
  socialProviderId: string
): ResultAsync<TwitterProfileData, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<"socialProviders">,
    }),
    () => new TwitterError("Database query failed")
  ).andThen((profile) => {
    if (!profile?.accessToken) {
      return err(new ProfileNotFoundError("Twitter"));
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
  if (!(profile.expiresIn && profile.refreshToken)) {
    return okAsync(profile);
  }

  if (profile.expiresIn > new Date()) {
    return okAsync(profile);
  }

  const oauth2 = new OAuth2({
    clientId: keys().TWITTER_CLIENT_ID,
    clientSecret: keys().TWITTER_CLIENT_SECRET,
    redirectUri: keys().TWITTER_CALLBACK_URL,
  });

  return ResultAsync.fromPromise(
    oauth2.refreshToken(profile.refreshToken),
    (_error) => new NetworkError("Twitter", "token refresh")
  ).andThen((data) => {
    const updatedProfile = {
      ...profile,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? profile.refreshToken,
      expiresIn: new Date(Date.now() + (data.expires_in ?? 7200) * 1000),
    };

    return ResultAsync.fromPromise(
      convex.mutation(api.social_providers.updateSocialProvider, {
        id: profile.id as Id<"socialProviders">,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? profile.refreshToken,
        expiresIn: Date.now() + (data.expires_in ?? 7200) * 1000,
      }),
      () => new TwitterError("Failed to update token in database")
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
    return errAsync(new NoContentError("Twitter"));
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
 * Download a file and return its buffer and MIME type
 */
const downloadFile = (
  fileUrl: string
): ResultAsync<{ buffer: Buffer; mimeType: string }, SocialProviderError> =>
  ResultAsync.fromPromise(
    axios({
      method: "get",
      url: fileUrl,
      responseType: "arraybuffer",
    }),
    (error) => createAPIError("Twitter", error)
  ).map((response) => ({
    buffer: Buffer.from(response.data),
    mimeType: getMimeType(fileUrl),
  }));

/**
 * One-shot upload for small images (<=5MB, non-GIF)
 */
const oneShotUpload = (
  client: Client,
  buffer: Buffer,
  mediaCategory: "tweet_image" | "tweet_gif" | "tweet_video",
  mimeType: string
): ResultAsync<string, SocialProviderError> =>
  ResultAsync.fromPromise(
    client.media.upload({
      body: {
        media: new Blob([buffer], { type: mimeType }),
        // biome-ignore lint/suspicious/noExplicitAny: XDK types use narrow enums that don't accept string variables
        mediaCategory: mediaCategory as any,
        // biome-ignore lint/suspicious/noExplicitAny: XDK types use narrow enums that don't accept string variables
        mediaType: mimeType as any,
      },
    }),
    (error) => createAPIError("Twitter", error)
  ).andThen((response) => {
    if (!response.data?.id) {
      return err(new MediaUploadError("Twitter", "IMAGE"));
    }
    return ok(response.data.id as string);
  });

/**
 * Initialize chunked media upload
 */
const initializeChunkedUpload = (
  client: Client,
  totalBytes: number,
  mimeType: string,
  mediaCategory: "tweet_image" | "tweet_gif" | "tweet_video",
  profileId: string
): ResultAsync<string, SocialProviderError> =>
  ResultAsync.fromPromise(
    client.media.initializeUpload({
      body: {
        totalBytes,
        // biome-ignore lint/suspicious/noExplicitAny: XDK types use narrow enums that don't accept string variables
        mediaType: mimeType as any,
        mediaCategory,
        additionalOwners: [profileId],
        shared: true,
      },
    }),
    (_error) => new NetworkError("Twitter", "media upload initialization")
  ).andThen((response) => {
    if (!response.data?.id) {
      return err(new MediaUploadError("Twitter", "IMAGE"));
    }
    return ok(response.data.id as string);
  });

/**
 * Upload file chunks
 */
const uploadChunks = (
  client: Client,
  mediaId: string,
  fileBuffer: Buffer,
  mimeType: string
): ResultAsync<void, SocialProviderError> => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

  const uploadAllChunks = async (): Promise<void> => {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);

      const result = await ResultAsync.fromPromise(
        client.media.appendUpload(mediaId, {
          body: {
            media: new Blob([chunk], { type: mimeType }),
            segmentIndex: i,
          },
        }),
        (_error) => new NetworkError("Twitter", "chunk upload")
      );

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

/**
 * Finalize media upload
 */
const finalizeUpload = (
  client: Client,
  mediaId: string
): ResultAsync<{ processingRequired: boolean }, SocialProviderError> =>
  ResultAsync.fromPromise(
    client.media.finalizeUpload(mediaId),
    (_error) => new NetworkError("Twitter", "media finalization")
  ).map((response) => ({
    processingRequired: !!response.data?.processing_info,
  }));

/**
 * Wait for media processing completion
 */
const waitForProcessing = (
  client: Client,
  mediaId: string
): ResultAsync<void, SocialProviderError> => {
  const checkStatus = (): ResultAsync<
    {
      isComplete: boolean;
      hasError: boolean;
      errorMessage?: string;
      checkAfterSecs?: number;
    },
    SocialProviderError
  > =>
    ResultAsync.fromPromise(
      client.media.getUploadStatus(mediaId),
      (_error) => new NetworkError("Twitter", "status check")
    ).map((response) => {
      const processingInfo = response.data?.processing_info;
      if (!processingInfo) {
        return { isComplete: true, hasError: false };
      }

      switch (processingInfo.state) {
        case "succeeded":
          return { isComplete: true, hasError: false };
        case "failed":
          return {
            isComplete: true,
            hasError: true,
            // biome-ignore lint/suspicious/noExplicitAny: XDK processing_info type doesn't include error field
            errorMessage: (processingInfo as any).error?.message,
          };
        default:
          return {
            isComplete: false,
            hasError: false,
            checkAfterSecs: processingInfo.check_after_secs,
          };
      }
    });

  const poll = async (attempts: number): Promise<void> => {
    const maxAttempts = 30;

    if (attempts >= maxAttempts) {
      throw new MediaProcessingTimeoutError("Twitter");
    }

    const statusResult = await checkStatus();
    if (statusResult.isErr()) {
      throw statusResult.error;
    }

    const status = statusResult.value;

    if (status.isComplete) {
      if (status.hasError) {
        throw new MediaProcessingError("Twitter", status.errorMessage);
      }
      return;
    }

    const waitMs = Math.max((status.checkAfterSecs ?? 10) * 1000, 1000);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return poll(attempts + 1);
  };

  return ResultAsync.fromPromise(
    poll(0),
    (error) => error as SocialProviderError
  );
};

/**
 * Upload media to Twitter
 */
const uploadMediaToTwitter = (
  fileUrl: string,
  profileId: string,
  client: Client
): ResultAsync<string, SocialProviderError> =>
  downloadFile(fileUrl).andThen(({ buffer, mimeType }) => {
    const mediaCategory = getMediaCategory(mimeType);
    const isSmallImage =
      mimeType.startsWith("image/") &&
      mimeType !== "image/gif" &&
      buffer.length <= 5 * 1024 * 1024;

    if (isSmallImage) {
      return oneShotUpload(client, buffer, mediaCategory, mimeType);
    }

    return initializeChunkedUpload(
      client,
      buffer.length,
      mimeType,
      mediaCategory,
      profileId
    ).andThen((mediaId) =>
      uploadChunks(client, mediaId, buffer, mimeType)
        .andThen(() => finalizeUpload(client, mediaId))
        .andThen(({ processingRequired }) => {
          if (processingRequired) {
            return waitForProcessing(client, mediaId).map(() => mediaId);
          }
          return okAsync(mediaId);
        })
    );
  });

/**
 * Upload multiple media files for a tweet
 */
const uploadTweetMedia = (
  media: MediaType[],
  profileId: string,
  client: Client
): ResultAsync<string[], SocialProviderError> => {
  if (!media.length) {
    return okAsync([]);
  }

  const validMediaUrls = getValidMediaUrls(media.slice(0, 4));
  const uploadPromises = validMediaUrls
    .filter((item) => item.url)
    .map((item) => uploadMediaToTwitter(item.url!, profileId, client));

  return ResultAsync.combine(uploadPromises);
};

/**
 * Post first tweet in thread
 */
const postFirstTweet = (
  tweet: Tweet,
  client: Client,
  profile: TwitterProfileData
): ResultAsync<{ tweetId: string }, SocialProviderError> =>
  uploadTweetMedia(tweet.media, profile.id, client).andThen((mediaIds) => {
    const tweetData = {
      text: tweet.text,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
    };

    return ResultAsync.fromPromise(client.posts.create(tweetData), (error) =>
      createAPIError("Twitter", error)
    ).andThen((response) => {
      if (!response.data?.id) {
        return err(new PostCreationError("Twitter"));
      }
      return ok({ tweetId: response.data.id });
    });
  });

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
        client
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
        client.posts.create(tweetData),
        (error) => createAPIError("Twitter", error)
      );

      if (replyResult.isErr()) {
        throw replyResult.error;
      }

      if (!replyResult.value.data?.id) {
        continue;
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
  const client = new Client({ accessToken: profile.accessToken });

  return postFirstTweet(tweets[0], client, profile).andThen(({ tweetId }) =>
    postThreadReplies(tweets.slice(1), client, profile, tweetId).map(() => ({
      platformPostId: tweetId,
      postId,
      platformId: profile.id,
      platformPostUrl: `https://x.com/${profile.username ?? "unknown"}/status/${tweetId}`,
      postedAt: new Date(),
    }))
  );
};

/**
 * Generate Twitter OAuth URL
 */
const generateConnectUrl = (): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: keys().TWITTER_CLIENT_ID,
    redirect_uri: keys().TWITTER_CALLBACK_URL,
    scope: [
      "users.read",
      "tweet.read",
      "offline.access",
      "tweet.write",
      "media.write",
    ].join(" "),
    state: keys().TWITTER_STATE,
    code_challenge: "challenge",
    code_challenge_method: "plain",
  });

  return `https://x.com/i/oauth2/authorize?${params.toString()}`;
};

/**
 * Main Twitter provider implementation
 */
export const twitterProvider: SocialProvider = {
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
