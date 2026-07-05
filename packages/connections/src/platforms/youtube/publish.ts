import type { IncomingMessage } from "node:http";
import https from "node:https";
import type { Readable } from "node:stream";
import { google } from "googleapis";
import { Effect } from "effect";
import {
  getValidMediaUrls,
  type SocialPublishInputType,
} from "@delulu/validators/post";
import {
  fromUnknownHttp,
  type ConnectionError,
  invalidMedia,
  profileNotFound,
} from "../../errors";
import { ConvexClient } from "../../services/convex";
import type { PlatformPublisher, PostResult, PublishContext } from "../../types";
import { MAX_FILE_SIZE, PROVIDER } from "./constants";

interface YouTubeProfile {
  id: string;
  profileId?: string;
  accessToken: string;
  refreshToken: string;
  username: string;
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
    privacyStatus: "public" | "private" | "unlisted";
    selfDeclaredMadeForKids?: boolean;
  };
}

// ── Profile ─────────────────────────────────────────────────────────────────

const getProfile = (
  socialProviderId: string
): Effect.Effect<YouTubeProfile, ConnectionError, ConvexClient> =>
  Effect.gen(function* () {
    const convex = yield* ConvexClient;
    const profile = yield* convex.getSocialProviderWithDecryptedTokens(
      socialProviderId
    );
    if (!(profile?.accessToken && profile?.refreshToken)) {
      return yield* Effect.fail(profileNotFound(PROVIDER));
    }
    return {
      id: profile._id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      username: profile.username ?? "",
    };
  });

// ── OAuth: fresh access token from the refresh token ──────────────────────────

const getFreshAccessToken = (
  refreshToken: string
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const token = yield* Effect.tryPromise({
      try: async () => {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID ?? "",
          process.env.GOOGLE_CLIENT_SECRET ?? "",
          process.env.YOUTUBE_CALLBACK_URL ?? ""
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const response = await oauth2Client.getAccessToken();
        return response.token;
      },
      catch: (e) => fromUnknownHttp(PROVIDER, e),
    });
    if (!token) {
      return yield* Effect.fail(
        invalidMedia(PROVIDER, "No access token received")
      );
    }
    return token;
  });

// ── Media streaming (Node-only https) ─────────────────────────────────────────

const getVideoStreamWithMimeType = (
  url: string
): Effect.Effect<{ stream: Readable; mimeType: string }, ConnectionError> =>
  Effect.tryPromise({
    try: () =>
      new Promise<{ stream: Readable; mimeType: string }>((resolve, reject) => {
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
              response.headers["content-length"] ?? "0",
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

            const contentType = response.headers["content-type"] || "video/mp4";
            resolve({ stream: response, mimeType: contentType });
          })
          .on("error", reject);
      }),
    catch: (e) =>
      e instanceof Error
        ? invalidMedia(PROVIDER, e.message)
        : fromUnknownHttp(PROVIDER, e),
  });

const getImageStream = (
  url: string
): Effect.Effect<{ stream: Readable; mimeType: string }, ConnectionError> =>
  Effect.tryPromise({
    try: () =>
      new Promise<{ stream: Readable; mimeType: string }>((resolve, reject) => {
        https
          .get(url, (response: IncomingMessage) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
              const redirectUrl = response.headers.location;
              if (redirectUrl) {
                https
                  .get(redirectUrl, (redirectResponse: IncomingMessage) => {
                    if (redirectResponse.statusCode !== 200) {
                      reject(
                        new Error(
                          `Failed to get image stream after redirect. Status Code: ${redirectResponse.statusCode}`
                        )
                      );
                      return;
                    }
                    const contentType =
                      redirectResponse.headers["content-type"] || "image/jpeg";
                    resolve({ stream: redirectResponse, mimeType: contentType });
                  })
                  .on("error", reject);
                return;
              }
            }

            if (response.statusCode !== 200) {
              reject(
                new Error(
                  `Failed to get image stream. Status Code: ${response.statusCode}`
                )
              );
              return;
            }

            const contentType = response.headers["content-type"] || "image/jpeg";
            resolve({ stream: response, mimeType: contentType });
          })
          .on("error", reject);
      }),
    catch: (e) =>
      e instanceof Error
        ? invalidMedia(PROVIDER, `Thumbnail fetch failed: ${e.message}`)
        : fromUnknownHttp(PROVIDER, e),
  });

// ── Upload (resumable, via googleapis) ────────────────────────────────────────

const uploadVideoToYouTube = (
  accessToken: string,
  videoStream: Readable,
  mimeType: string,
  metadata: YouTubeVideoMetadata
): Effect.Effect<{ id: string }, ConnectionError> =>
  Effect.gen(function* () {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: "v3", auth });

    const response = yield* Effect.tryPromise({
      try: () =>
        youtube.videos.insert({
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              ...metadata.snippet,
              tags: metadata.snippet.tags ?? [],
            },
            status: {
              privacyStatus: metadata.status.privacyStatus,
              selfDeclaredMadeForKids:
                metadata.status.selfDeclaredMadeForKids ?? false,
              madeForKids: metadata.status.selfDeclaredMadeForKids ?? false,
            },
          },
          media: {
            body: videoStream,
            mimeType,
          },
        }),
      catch: (e) => fromUnknownHttp(PROVIDER, e),
    });

    const id = response.data.id;
    if (!id) {
      return yield* Effect.fail(
        invalidMedia(PROVIDER, "Failed to get video ID from YouTube response")
      );
    }
    return { id };
  });

// Note: YouTube requires channel verification to upload custom thumbnails.
const setVideoThumbnail = (
  accessToken: string,
  videoId: string,
  thumbnailUrl: string
): Effect.Effect<void, ConnectionError> =>
  Effect.gen(function* () {
    const { stream, mimeType } = yield* getImageStream(thumbnailUrl);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: "v3", auth });

    yield* Effect.tryPromise({
      try: () =>
        youtube.thumbnails.set({
          videoId,
          media: { body: stream, mimeType },
        }),
      catch: (e) => {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes("forbidden") || message.includes("verify")) {
          return invalidMedia(
            PROVIDER,
            "Custom thumbnails require a verified YouTube channel"
          );
        }
        return fromUnknownHttp(PROVIDER, e);
      },
    });
  });

// ── Orchestration ─────────────────────────────────────────────────────────────

const publishContent = (
  content: SocialPublishInputType,
  profile: YouTubeProfile
): Effect.Effect<PostResult, ConnectionError> =>
  Effect.gen(function* () {
    const firstContent = content.content[0];
    if (!firstContent) {
      return yield* Effect.fail(invalidMedia(PROVIDER, "No content to publish"));
    }

    const validMedia = getValidMediaUrls(firstContent.media);
    const videoMedia = validMedia.find(
      (media) => media.mediaType === "VIDEO" && media.url
    );
    if (!videoMedia?.url) {
      return yield* Effect.fail(
        invalidMedia(PROVIDER, "YouTube Shorts requires a video file")
      );
    }

    // YouTube only supports custom image thumbnails, not timestamp-based ones.
    const customThumbnailUrl = videoMedia.thumbnailBucketUrl;

    // Resolve privacy + madeForKids from provider settings when present.
    const ytSettings =
      content.providerSettings?.type === "YOUTUBE"
        ? content.providerSettings.settings
        : undefined;
    const privacyStatus: "public" | "private" | "unlisted" =
      ytSettings?.privacy === "PRIVATE"
        ? "private"
        : ytSettings?.privacy === "UNLISTED"
          ? "unlisted"
          : "public";
    const madeForKids = ytSettings?.madeForKids ?? false;

    const freshAccessToken = yield* getFreshAccessToken(profile.refreshToken);
    const { stream, mimeType } = yield* getVideoStreamWithMimeType(
      videoMedia.url
    );

    // Title: explicit title, else truncate text at a word boundary (80 chars).
    let title = firstContent.title;
    if (!title) {
      const fullText = firstContent.text || "";
      title = fullText.slice(0, 80);
      if (fullText.length > 80) {
        const lastSpace = title.lastIndexOf(" ");
        title = lastSpace > 20 ? `${title.slice(0, lastSpace)}...` : `${title}...`;
      }
    }

    const metadata: YouTubeVideoMetadata = {
      snippet: {
        title: title || "YouTube Short",
        description: firstContent.text || "",
        tags: firstContent.tags || [],
        categoryId: "24", // Entertainment
        defaultLanguage: "en",
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: madeForKids,
      },
    };

    // Add #Shorts to help YouTube identify the upload as a Short.
    if (!metadata.snippet.description.includes("#Shorts")) {
      metadata.snippet.description += "\n\n#Shorts";
    }

    const upload = yield* uploadVideoToYouTube(
      freshAccessToken,
      stream,
      mimeType,
      metadata
    );

    if (customThumbnailUrl) {
      yield* setVideoThumbnail(freshAccessToken, upload.id, customThumbnailUrl);
    }

    return {
      platformPostId: upload.id,
      platformPostUrl: `https://www.youtube.com/shorts/${upload.id}`,
      platformId: profile.id,
      postId: content.postId,
      postedAt: new Date(),
    } satisfies PostResult;
  });

export const youtubePublisher: PlatformPublisher = {
  id: "YOUTUBE",
  publish: (ctx: PublishContext) =>
    getProfile(ctx.socialProviderId).pipe(
      Effect.flatMap((profile) => publishContent(ctx.content, profile))
    ),
};
