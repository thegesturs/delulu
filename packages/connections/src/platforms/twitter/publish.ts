import {
  getValidMediaUrls,
  type MediaType,
  type SocialPublishInputType,
} from "@delulu/validators/post";
import { Client } from "@xdevplatform/xdk";
import axios from "axios";
import { Duration, Effect } from "effect";
import {
  type ConnectionError,
  fromUnknownHttp,
  invalidMedia,
  mediaProcessingError,
  mediaProcessingTimeout,
  networkError,
  profileNotFound,
  publishRejected,
} from "../../errors";
import { ConvexClient } from "../../services/convex";
import type {
  PlatformPublisher,
  PostResult,
  PublishContext,
} from "../../types";
import { PROVIDER } from "./constants";

const POLL_MAX_ATTEMPTS = 30;
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

interface TwitterProfile {
  id: string;
  accessToken: string;
  username?: string;
}

interface Tweet {
  text: string;
  media: MediaType[];
  order: number;
}

type MediaCategory = "tweet_image" | "tweet_gif" | "tweet_video";

// ── MIME helpers (ported verbatim) ────────────────────────────────────────────

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

const getMediaCategory = (mimeType: string): MediaCategory => {
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

// ── Profile ─────────────────────────────────────────────────────────────────

const getProfile = (
  socialProviderId: string
): Effect.Effect<TwitterProfile, ConnectionError, ConvexClient> =>
  Effect.gen(function* () {
    const convex = yield* ConvexClient;
    const profile =
      yield* convex.getSocialProviderWithDecryptedTokens(socialProviderId);
    if (!profile?.accessToken) {
      return yield* Effect.fail(profileNotFound(PROVIDER));
    }
    return {
      id: profile._id,
      accessToken: profile.accessToken,
      username: profile.username ?? undefined,
    };
  });

// ── Media download + upload ───────────────────────────────────────────────────

const downloadFile = (
  fileUrl: string
): Effect.Effect<{ buffer: Buffer; mimeType: string }, ConnectionError> =>
  Effect.tryPromise({
    try: () =>
      axios({ method: "get", url: fileUrl, responseType: "arraybuffer" }).then(
        (response) => ({
          buffer: Buffer.from(response.data),
          mimeType: getMimeType(fileUrl),
        })
      ),
    catch: (e) => fromUnknownHttp(PROVIDER, e),
  });

const oneShotUpload = (
  client: Client,
  buffer: Buffer,
  mediaCategory: MediaCategory,
  mimeType: string
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        client.media.upload({
          body: {
            media: new Blob([buffer], { type: mimeType }),
            // biome-ignore lint/suspicious/noExplicitAny: XDK types use narrow enums that don't accept string variables
            mediaCategory: mediaCategory as any,
            // biome-ignore lint/suspicious/noExplicitAny: XDK types use narrow enums that don't accept string variables
            mediaType: mimeType as any,
          },
        }),
      catch: (e) => fromUnknownHttp(PROVIDER, e),
    });
    if (!response.data?.id) {
      return yield* Effect.fail(invalidMedia(PROVIDER, "image upload failed"));
    }
    return response.data.id as string;
  });

const initializeChunkedUpload = (
  client: Client,
  totalBytes: number,
  mimeType: string,
  mediaCategory: MediaCategory,
  profileId: string
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
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
      catch: () => networkError(PROVIDER, "media upload initialization"),
    });
    if (!response.data?.id) {
      return yield* Effect.fail(
        invalidMedia(PROVIDER, "media upload initialization failed")
      );
    }
    return response.data.id as string;
  });

const uploadChunks = (
  client: Client,
  mediaId: string,
  fileBuffer: Buffer,
  mimeType: string
): Effect.Effect<void, ConnectionError> => {
  const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

  const uploadAllChunks = async (): Promise<void> => {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);

      await client.media.appendUpload(mediaId, {
        body: {
          media: new Blob([chunk], { type: mimeType }),
          segmentIndex: i,
        },
      });
    }
  };

  return Effect.tryPromise({
    try: () => uploadAllChunks(),
    catch: () => networkError(PROVIDER, "chunk upload"),
  });
};

const finalizeUpload = (
  client: Client,
  mediaId: string
): Effect.Effect<{ processingRequired: boolean }, ConnectionError> =>
  Effect.tryPromise({
    try: () => client.media.finalizeUpload(mediaId),
    catch: () => networkError(PROVIDER, "media finalization"),
  }).pipe(
    Effect.map((response) => ({
      processingRequired: !!response.data?.processing_info,
    }))
  );

const waitForProcessing = (
  client: Client,
  mediaId: string,
  attempt = 0
): Effect.Effect<void, ConnectionError> =>
  Effect.gen(function* () {
    if (attempt >= POLL_MAX_ATTEMPTS) {
      return yield* Effect.fail(mediaProcessingTimeout(PROVIDER));
    }

    const response = yield* Effect.tryPromise({
      try: () => client.media.getUploadStatus(mediaId),
      catch: () => networkError(PROVIDER, "status check"),
    });

    const processingInfo = response.data?.processing_info;
    if (!processingInfo) {
      return; // no processing info → treated as complete
    }

    if (processingInfo.state === "succeeded") {
      return;
    }
    if (processingInfo.state === "failed") {
      return yield* Effect.fail(
        mediaProcessingError(
          PROVIDER,
          // biome-ignore lint/suspicious/noExplicitAny: XDK processing_info type doesn't include error field
          (processingInfo as any).error?.message
        )
      );
    }

    const waitMs = Math.max(
      (processingInfo.check_after_secs ?? 10) * 1000,
      1000
    );
    yield* Effect.sleep(Duration.millis(waitMs));
    return yield* waitForProcessing(client, mediaId, attempt + 1);
  });

const uploadMediaToTwitter = (
  fileUrl: string,
  profileId: string,
  client: Client
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const { buffer, mimeType } = yield* downloadFile(fileUrl);
    const mediaCategory = getMediaCategory(mimeType);
    const isSmallImage =
      mimeType.startsWith("image/") &&
      mimeType !== "image/gif" &&
      buffer.length <= 5 * 1024 * 1024;

    if (isSmallImage) {
      return yield* oneShotUpload(client, buffer, mediaCategory, mimeType);
    }

    const mediaId = yield* initializeChunkedUpload(
      client,
      buffer.length,
      mimeType,
      mediaCategory,
      profileId
    );
    yield* uploadChunks(client, mediaId, buffer, mimeType);
    const { processingRequired } = yield* finalizeUpload(client, mediaId);
    if (processingRequired) {
      yield* waitForProcessing(client, mediaId);
    }
    return mediaId;
  });

const uploadTweetMedia = (
  media: MediaType[],
  profileId: string,
  client: Client
): Effect.Effect<string[], ConnectionError> => {
  if (!media.length) {
    return Effect.succeed([]);
  }

  const validMediaUrls = getValidMediaUrls(media.slice(0, 4)).filter(
    (item) => item.url
  );

  return Effect.all(
    validMediaUrls.map((item) =>
      uploadMediaToTwitter(item.url as string, profileId, client)
    ),
    { concurrency: "unbounded" }
  );
};

// ── Tweets / thread ────────────────────────────────────────────────────────────

const validateAndSortTweets = (
  content: SocialPublishInputType["content"]
): Effect.Effect<Tweet[], ConnectionError> => {
  if (!content.length) {
    return Effect.fail(invalidMedia(PROVIDER, "No content to publish"));
  }

  const tweets: Tweet[] = content
    .map((tweet) => ({
      text: tweet.text,
      media: tweet.media,
      order: tweet.order,
    }))
    .sort((a, b) => a.order - b.order);

  return Effect.succeed(tweets);
};

const postFirstTweet = (
  tweet: Tweet,
  client: Client,
  profile: TwitterProfile
): Effect.Effect<{ tweetId: string }, ConnectionError> =>
  Effect.gen(function* () {
    const mediaIds = yield* uploadTweetMedia(tweet.media, profile.id, client);
    const tweetData = {
      text: tweet.text,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
    };

    const response = yield* Effect.tryPromise({
      try: () => client.posts.create(tweetData),
      catch: (e) => fromUnknownHttp(PROVIDER, e),
    });
    if (!response.data?.id) {
      return yield* Effect.fail(
        publishRejected(PROVIDER, "post creation failed")
      );
    }
    return { tweetId: response.data.id };
  });

const postThreadReplies = (
  tweets: Tweet[],
  client: Client,
  profile: TwitterProfile,
  replyToTweetId: string
): Effect.Effect<void, ConnectionError> => {
  if (!tweets.length) {
    return Effect.void;
  }

  // Replies must be posted sequentially so each links to the previous tweet.
  const postReplies = (
    remaining: Tweet[],
    replyId: string
  ): Effect.Effect<void, ConnectionError> => {
    const [tweet, ...rest] = remaining;
    if (!tweet) {
      return Effect.void;
    }

    return Effect.gen(function* () {
      const mediaIds = yield* uploadTweetMedia(tweet.media, profile.id, client);
      const tweetData = {
        text: tweet.text,
        reply: { in_reply_to_tweet_id: replyId },
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
      };

      const response = yield* Effect.tryPromise({
        try: () => client.posts.create(tweetData),
        catch: (e) => fromUnknownHttp(PROVIDER, e),
      });

      // If the reply id is missing, keep chaining off the previous id
      // (matches the provider's `continue` behaviour).
      const nextReplyId = response.data?.id ?? replyId;
      return yield* postReplies(rest, nextReplyId);
    });
  };

  return postReplies(tweets, replyToTweetId);
};

const publishTwitterThread = (
  tweets: Tweet[],
  profile: TwitterProfile,
  postId: string
): Effect.Effect<PostResult, ConnectionError> =>
  Effect.gen(function* () {
    const client = new Client({ accessToken: profile.accessToken });

    const { tweetId } = yield* postFirstTweet(tweets[0], client, profile);
    yield* postThreadReplies(tweets.slice(1), client, profile, tweetId);

    return {
      platformPostId: tweetId,
      postId,
      platformId: profile.id,
      platformPostUrl: `https://x.com/${profile.username ?? "unknown"}/status/${tweetId}`,
      postedAt: new Date(),
    } satisfies PostResult;
  });

// ── Orchestration ────────────────────────────────────────────────────────────

const publishContent = (
  content: SocialPublishInputType,
  profile: TwitterProfile
): Effect.Effect<PostResult, ConnectionError> =>
  validateAndSortTweets(content.content).pipe(
    Effect.flatMap((tweets) =>
      publishTwitterThread(tweets, profile, content.postId)
    )
  );

export const twitterPublisher: PlatformPublisher = {
  id: "TWITTER",
  publish: (ctx: PublishContext) =>
    getProfile(ctx.socialProviderId).pipe(
      Effect.flatMap((profile) => publishContent(ctx.content, profile))
    ),
};
