import axios from "axios";
import { Duration, Effect } from "effect";
import {
  getValidMediaUrls,
  promotionContentTypes,
  type SocialPublishInputType,
  type TikTokSettings,
} from "@delulu/validators/post";
import {
  fromUnknownHttp,
  type ConnectionError,
  invalidMedia,
  mediaProcessingError,
  mediaProcessingTimeout,
  profileNotFound,
  tokenExpired,
} from "../../errors";
import { ConvexClient } from "../../services/convex";
import type { PlatformPublisher, PostResult, PublishContext } from "../../types";
import {
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  PROVIDER,
  STATUS_FETCH_URL,
  TITLE_LIMIT,
  VIDEO_INIT_URL,
  VIDEO_LIST_URL,
} from "./constants";

/**
 * TikTok publishing (Effect port of `worker/providers/tiktok.provider.ts`).
 *
 * Flow: refresh the access token (TikTok's short-lived tokens expire fast),
 * init a video publish via PULL_FROM_URL, poll publish status until
 * PUBLISH_COMPLETE, then look up the real video id from the video list API to
 * build a canonical URL.
 */

interface TikTokProfile {
  id: string;
  accessToken: string;
  refreshToken: string;
  username: string;
  profileId: string;
}

interface TikTokRefreshResponse {
  access_token?: string;
}
interface TikTokVideoInitResponse {
  data?: { publish_id?: string };
}
interface TikTokStatusResponse {
  data?: { status?: string; fail_reason?: string };
}
interface TikTokVideoListResponse {
  data?: { videos?: { id: string; create_time: number }[] };
}

const tiktokEnv = () => ({
  TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID ?? "",
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ?? "",
});

const getProfile = (
  socialProviderId: string
): Effect.Effect<TikTokProfile, ConnectionError, ConvexClient> =>
  Effect.gen(function* () {
    const convex = yield* ConvexClient;
    const profile = yield* convex.getSocialProviderWithDecryptedTokens(
      socialProviderId
    );
    if (!(profile?.accessToken && profile.refreshToken)) {
      return yield* Effect.fail(profileNotFound(PROVIDER));
    }
    return {
      id: profile._id,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      username: profile.username ?? "",
      profileId: profile.profileId ?? "",
    } satisfies TikTokProfile;
  });

/**
 * Get a fresh access token from the refresh token. TikTok access tokens are
 * short-lived, so the provider always refreshes right before publishing.
 */
const getFreshAccessToken = (
  refreshToken: string
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const e = tiktokEnv();
    const data = yield* Effect.tryPromise({
      try: () =>
        axios
          .post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            new URLSearchParams({
              client_key: e.TIKTOK_CLIENT_ID,
              client_secret: e.TIKTOK_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: refreshToken,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          )
          .then((r) => r.data as TikTokRefreshResponse),
      catch: () => tokenExpired(PROVIDER, "Failed to get fresh access token"),
    });

    if (!data.access_token) {
      return yield* Effect.fail(
        tokenExpired(PROVIDER, "No access token received")
      );
    }
    return data.access_token;
  });

/**
 * Init a video publish via PULL_FROM_URL, threading TikTok content settings
 * (privacy/comments/duet/stitch/promotion) into `post_info`. Returns publish_id.
 */
const uploadVideo = (
  accessToken: string,
  videoUrl: string,
  caption: string,
  media: { thumbnailTimestamp?: number },
  settings?: TikTokSettings
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const thumbnailTimestampMs = media.thumbnailTimestamp
      ? Math.floor(media.thumbnailTimestamp * 1000)
      : 1000;

    // biome-ignore lint/suspicious/noExplicitAny: TikTok post_info is dynamically shaped.
    const postInfo: any = {
      title: caption.slice(0, TITLE_LIMIT) || "TikTok Video",
      privacy_level: settings?.privacy || "PUBLIC_TO_EVERYONE",
      disable_duet: settings?.allowDuet === false,
      disable_comment: settings?.allowComments === false,
      disable_stitch: settings?.allowStitch === false,
      video_cover_timestamp_ms: thumbnailTimestampMs,
    };

    if (
      settings?.promotionContent &&
      settings.promotionContent !== promotionContentTypes.NONE
    ) {
      postInfo.brand_content_toggle = true;
      if (settings.promotionContent === promotionContentTypes.SELF) {
        postInfo.brand_organic_toggle = true;
        postInfo.branded_content_toggle = false;
      } else if (settings.promotionContent === promotionContentTypes.PAID) {
        postInfo.brand_organic_toggle = false;
        postInfo.branded_content_toggle = true;
      } else if (settings.promotionContent === promotionContentTypes.BOTH) {
        postInfo.brand_organic_toggle = true;
        postInfo.branded_content_toggle = true;
      }
    }

    const uploadData = {
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
      post_info: postInfo,
    };

    const data = yield* Effect.tryPromise({
      try: () =>
        axios
          .post(VIDEO_INIT_URL, uploadData, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json; charset=UTF-8",
            },
          })
          .then((r) => r.data as TikTokVideoInitResponse),
      catch: (err) => fromUnknownHttp(PROVIDER, err),
    });

    const publishId = data.data?.publish_id;
    if (!publishId) {
      return yield* Effect.fail(
        mediaProcessingError(PROVIDER, "Failed to get publish ID from TikTok")
      );
    }
    return publishId;
  });

const checkPostStatus = (
  accessToken: string,
  publishId: string
): Effect.Effect<{ status: string; fail_reason?: string }, ConnectionError> =>
  Effect.gen(function* () {
    const data = yield* Effect.tryPromise({
      try: () =>
        axios
          .post(
            STATUS_FETCH_URL,
            { publish_id: publishId },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",
              },
            }
          )
          .then((r) => r.data as TikTokStatusResponse),
      catch: (err) => fromUnknownHttp(PROVIDER, err),
    });

    if (!data.data) {
      return yield* Effect.fail(
        mediaProcessingError(PROVIDER, "Failed to get post status from TikTok")
      );
    }
    return { status: data.data.status ?? "", fail_reason: data.data.fail_reason };
  });

/** Poll publish status until PUBLISH_COMPLETE / FAILED / timeout. */
const waitForPostCompletion = (
  accessToken: string,
  publishId: string,
  attempt = 0
): Effect.Effect<void, ConnectionError> =>
  Effect.gen(function* () {
    if (attempt >= POLL_MAX_ATTEMPTS) {
      return yield* Effect.fail(mediaProcessingTimeout(PROVIDER));
    }

    const { status, fail_reason } = yield* checkPostStatus(
      accessToken,
      publishId
    );

    if (status === "PUBLISH_COMPLETE") {
      return;
    }
    if (status === "FAILED") {
      return yield* Effect.fail(
        mediaProcessingError(PROVIDER, fail_reason || "Unknown error")
      );
    }

    yield* Effect.sleep(Duration.millis(POLL_INTERVAL_MS));
    return yield* waitForPostCompletion(accessToken, publishId, attempt + 1);
  });

/**
 * Fetch the real video id from the video list API (with retry), so the returned
 * URL points at the actual video rather than the transient publish_id.
 */
const getRecentVideoId = (
  accessToken: string,
  maxAgeMinutes = 5,
  attempt = 0,
  maxRetries = 3
): Effect.Effect<string | null, ConnectionError> =>
  Effect.gen(function* () {
    // Give the video a moment to propagate into the list API on first attempt.
    yield* Effect.sleep(Duration.millis(attempt === 0 ? 3000 : 5000));

    const data = yield* Effect.tryPromise({
      try: () =>
        axios
          .post(
            VIDEO_LIST_URL,
            { max_count: 10 },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=UTF-8",
              },
            }
          )
          .then((r) => r.data as TikTokVideoListResponse),
      catch: (err) => fromUnknownHttp(PROVIDER, err),
    });

    const videos = data.data?.videos ?? [];
    if (videos.length > 0) {
      const now = Date.now() / 1000;
      const maxAge = maxAgeMinutes * 60;
      const recent = videos.find((v) => now - v.create_time <= maxAge);
      if (recent) {
        return recent.id;
      }
    }

    if (attempt < maxRetries - 1) {
      return yield* getRecentVideoId(
        accessToken,
        maxAgeMinutes,
        attempt + 1,
        maxRetries
      );
    }
    return null;
  });

const publishContent = (
  content: SocialPublishInputType,
  profile: TikTokProfile
): Effect.Effect<PostResult, ConnectionError> =>
  Effect.gen(function* () {
    const firstContent = content.content[0];
    if (!firstContent) {
      return yield* Effect.fail(invalidMedia(PROVIDER, "No content to publish"));
    }

    const validMedia = getValidMediaUrls(firstContent.media);
    const videoMedia = validMedia.find(
      (m) => m.mediaType === "VIDEO" && m.url
    );
    if (!videoMedia?.url) {
      return yield* Effect.fail(
        invalidMedia(PROVIDER, "TikTok requires exactly one video file")
      );
    }

    const caption = firstContent.text || "TikTok Video";

    const tiktokSettings =
      content.providerSettings?.type === "TIKTOK"
        ? content.providerSettings.settings
        : undefined;

    const freshAccessToken = yield* getFreshAccessToken(profile.refreshToken);

    const publishId = yield* uploadVideo(
      freshAccessToken,
      videoMedia.url,
      caption,
      videoMedia,
      tiktokSettings
    );

    yield* waitForPostCompletion(freshAccessToken, publishId);

    const itemId = yield* getRecentVideoId(freshAccessToken);
    const videoId = itemId || publishId;

    return {
      platformPostId: publishId,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: `https://www.tiktok.com/@${profile.username}/video/${videoId}`,
      postedAt: new Date(),
    } satisfies PostResult;
  });

export const tiktokPublisher: PlatformPublisher = {
  id: "TIKTOK",
  publish: (ctx: PublishContext) =>
    getProfile(ctx.socialProviderId).pipe(
      Effect.flatMap((profile) => publishContent(ctx.content, profile))
    ),
};
