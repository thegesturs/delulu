import {
  getValidMediaUrls,
  type SocialPublishInputType,
} from "@delulu/validators/post";
import axios from "axios";
import { Duration, Effect } from "effect";
import {
  type ConnectionError,
  fromUnknownHttp,
  invalidMedia,
  mediaProcessingError,
  mediaProcessingTimeout,
  profileNotFound,
} from "../../errors";
import { ConvexClient } from "../../services/convex";
import type {
  PlatformPublisher,
  PostResult,
  PublishContext,
} from "../../types";
import {
  LINKEDIN_VERSION,
  MAX_DOCUMENT_BYTES,
  MAX_VIDEO_BYTES,
  MIN_VIDEO_BYTES,
  PROVIDER,
  VIDEO_CHUNK_BYTES,
  VIDEO_POLL_INTERVAL_MS,
  VIDEO_POLL_MAX_ATTEMPTS,
} from "./constants";

interface LinkedInProfile {
  id: string;
  profileId: string;
  accessToken: string;
  username: string;
}

interface LinkedInMediaAsset {
  assetUrn: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  title?: string;
  description?: string;
}

type PostContentType =
  | "TEXT_ONLY"
  | "SINGLE_IMAGE"
  | "MULTI_IMAGE"
  | "VIDEO"
  | "DOCUMENT";

type VideoStatus =
  | "AVAILABLE"
  | "PROCESSING"
  | "PROCESSING_FAILED"
  | "WAITING_UPLOAD";

interface BuildLinkedInPostDataOptions {
  visibility?: "PUBLIC" | "CONNECTIONS";
}

// LinkedIn's REST API auth/version headers, shared across every call.
const jsonHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
  "LinkedIn-Version": LINKEDIN_VERSION,
  "X-Restli-Protocol-Version": "2.0.0",
});

const binaryHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/octet-stream",
});

const ownerUrn = (profileId: string, isOrg: boolean) =>
  isOrg ? `urn:li:organization:${profileId}` : `urn:li:person:${profileId}`;

// ── Profile ─────────────────────────────────────────────────────────────────

const getProfile = (
  socialProviderId: string
): Effect.Effect<LinkedInProfile, ConnectionError, ConvexClient> =>
  Effect.gen(function* () {
    const convex = yield* ConvexClient;
    const profile =
      yield* convex.getSocialProviderWithDecryptedTokens(socialProviderId);
    if (!(profile?.accessToken && profile.profileId)) {
      return yield* Effect.fail(profileNotFound(PROVIDER));
    }
    return {
      id: profile._id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
      username: profile.username ?? "",
    };
  });

// ── Image upload ──────────────────────────────────────────────────────────────

const uploadImageToLinkedIn = (
  imageUrl: string,
  profileId: string,
  accessToken: string
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    // Step 1: Download the image as a buffer.
    const download = yield* Effect.tryPromise({
      try: () => axios.get(imageUrl, { responseType: "arraybuffer" }),
      catch: () => invalidMedia(PROVIDER, "Failed to download image"),
    });
    const imageBuffer = download.data;

    // Step 2: Register upload with LinkedIn.
    const registerRes = yield* Effect.tryPromise({
      try: () =>
        axios.post(
          "https://api.linkedin.com/rest/images?action=initializeUpload",
          {
            initializeUploadRequest: {
              owner: `urn:li:person:${profileId}`,
            },
          },
          { headers: jsonHeaders(accessToken) }
        ),
      catch: (e) => fromUnknownHttp(PROVIDER, e),
    });
    const uploadUrl = registerRes.data.value.uploadUrl;
    const assetUrn = registerRes.data.value.image;

    // Step 3: Upload the image binary to LinkedIn.
    yield* Effect.tryPromise({
      try: () =>
        axios.put(uploadUrl, imageBuffer, {
          headers: binaryHeaders(accessToken),
        }),
      catch: () => mediaProcessingError(PROVIDER, "Image upload failed"),
    });

    return assetUrn;
  });

// ── Document upload ───────────────────────────────────────────────────────────

const uploadDocumentToLinkedIn = (
  documentUrl: string,
  profileId: string,
  accessToken: string,
  isOrg = false
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    const download = yield* Effect.tryPromise({
      try: () => axios.get(documentUrl, { responseType: "arraybuffer" }),
      catch: () => invalidMedia(PROVIDER, "Failed to download document"),
    });
    const docBuffer = Buffer.from(download.data);

    if (docBuffer.length > MAX_DOCUMENT_BYTES) {
      return yield* Effect.fail(
        invalidMedia(
          PROVIDER,
          `Document file too large: ${(docBuffer.length / 1024 / 1024).toFixed(2)}MB (maximum 100MB)`
        )
      );
    }

    const registerRes = yield* Effect.tryPromise({
      try: () =>
        axios.post(
          "https://api.linkedin.com/rest/documents?action=initializeUpload",
          {
            initializeUploadRequest: {
              owner: ownerUrn(profileId, isOrg),
            },
          },
          { headers: jsonHeaders(accessToken) }
        ),
      catch: (e) => fromUnknownHttp(PROVIDER, e),
    });
    const uploadUrl = registerRes.data.value.uploadUrl;
    const documentUrn = registerRes.data.value.document;

    yield* Effect.tryPromise({
      try: () =>
        axios.put(uploadUrl, docBuffer, {
          headers: binaryHeaders(accessToken),
        }),
      catch: () => mediaProcessingError(PROVIDER, "Document upload failed"),
    });

    return documentUrn;
  });

// ── Video upload ──────────────────────────────────────────────────────────────

const validateVideoForLinkedIn = (
  videoBuffer: Buffer,
  videoUrl: string
): Effect.Effect<void, ConnectionError> => {
  const fileSizeBytes = videoBuffer.length;

  console.log(
    `[LinkedIn Video] Validating video: ${videoUrl}, size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB`
  );

  if (fileSizeBytes < MIN_VIDEO_BYTES) {
    return Effect.fail(
      invalidMedia(
        PROVIDER,
        `Video file too small: ${fileSizeBytes} bytes (minimum 75KB)`
      )
    );
  }
  if (fileSizeBytes > MAX_VIDEO_BYTES) {
    return Effect.fail(
      invalidMedia(
        PROVIDER,
        `Video file too large: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB (maximum 500MB)`
      )
    );
  }

  // Note: We can't validate video length without decoding, but LinkedIn will
  // reject invalid videos.
  return Effect.void;
};

const chunkBuffer = (buffer: Buffer, chunkSize: number): Buffer[] => {
  const chunks: Buffer[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.subarray(i, i + chunkSize));
  }
  return chunks;
};

const uploadVideoToLinkedIn = (
  videoUrl: string,
  profileId: string,
  accessToken: string,
  isOrg = false
): Effect.Effect<string, ConnectionError> =>
  Effect.gen(function* () {
    console.log(`[LinkedIn Video] Starting video upload: ${videoUrl}`);

    // Step 1: Download the video as a buffer.
    const download = yield* Effect.tryPromise({
      try: () => axios.get(videoUrl, { responseType: "arraybuffer" }),
      catch: (error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return invalidMedia(
          PROVIDER,
          `Failed to download video from ${videoUrl}: ${errorMessage}`
        );
      },
    });
    const videoBuffer = Buffer.from(download.data);
    console.log(
      `[LinkedIn Video] Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`
    );

    // Validate video specifications.
    yield* validateVideoForLinkedIn(videoBuffer, videoUrl);

    const owner = ownerUrn(profileId, isOrg);
    console.log(`[LinkedIn Video] Using owner URN: ${owner}`);

    // Step 2: Register upload with LinkedIn.
    const registerRes = yield* Effect.tryPromise({
      try: () =>
        axios.post(
          "https://api.linkedin.com/rest/videos?action=initializeUpload",
          {
            initializeUploadRequest: {
              owner,
              fileSizeBytes: videoBuffer.length,
              uploadCaptions: false,
              uploadThumbnail: false,
            },
          },
          { headers: jsonHeaders(accessToken) }
        ),
      catch: (error) => {
        console.log("[LinkedIn Video] Initialize upload failed:", error);
        return fromUnknownHttp(PROVIDER, error);
      },
    });

    const uploadInstructions = registerRes.data.value
      .uploadInstructions as Array<{ uploadUrl?: string }>;
    const assetUrn = registerRes.data.value.video as string;
    const uploadToken = registerRes.data.value.uploadToken;

    console.log(
      `[LinkedIn Video] Upload initialized - Video URN: ${assetUrn}, Upload URLs: ${uploadInstructions?.length ?? 0}`
    );

    if (!uploadInstructions || uploadInstructions.length === 0) {
      return yield* Effect.fail(
        mediaProcessingError(PROVIDER, "No upload instructions returned")
      );
    }

    // Step 3: Upload video in chunks (4MB each).
    const chunks = chunkBuffer(videoBuffer, VIDEO_CHUNK_BYTES);
    console.log(
      `[LinkedIn Video] Splitting into ${chunks.length} chunks of ~${(VIDEO_CHUNK_BYTES / 1024 / 1024).toFixed(2)}MB each`
    );

    const uploadedPartIds = yield* Effect.all(
      chunks.map((chunk, index) =>
        Effect.gen(function* () {
          const uploadUrl = uploadInstructions[index]?.uploadUrl;
          if (!uploadUrl) {
            return yield* Effect.fail(
              mediaProcessingError(
                PROVIDER,
                `Missing upload URL for chunk ${index + 1}`
              )
            );
          }

          console.log(
            `[LinkedIn Video] Uploading chunk ${index + 1}/${chunks.length} (${(chunk.length / 1024 / 1024).toFixed(2)}MB)`
          );

          const uploadResponse = yield* Effect.tryPromise({
            try: () =>
              axios.put(uploadUrl, chunk, {
                headers: binaryHeaders(accessToken),
              }),
            catch: (error) => {
              console.log(
                `[LinkedIn Video] Chunk ${index + 1} upload failed:`,
                error
              );
              return mediaProcessingError(
                PROVIDER,
                `Video chunk ${index + 1} upload failed`
              );
            },
          });

          const etag = uploadResponse.headers.etag as string;
          console.log(
            `[LinkedIn Video] Chunk ${index + 1} uploaded successfully, ETag: ${etag}`
          );
          return etag;
        })
      )
    );

    console.log(
      `[LinkedIn Video] All chunks uploaded, finalizing upload with ${uploadedPartIds.length} ETags`
    );

    // Step 4: Finalize the upload.
    yield* Effect.tryPromise({
      try: () =>
        axios.post(
          "https://api.linkedin.com/rest/videos?action=finalizeUpload",
          {
            finalizeUploadRequest: {
              video: assetUrn,
              uploadToken,
              uploadedPartIds,
            },
          },
          { headers: jsonHeaders(accessToken) }
        ),
      catch: (error: unknown) => {
        console.log("[LinkedIn Video] Finalize upload failed:", error);
        return fromUnknownHttp(PROVIDER, error);
      },
    });

    console.log(`[LinkedIn Video] Upload finalized successfully: ${assetUrn}`);
    return assetUrn;
  });

// ── Video processing status ────────────────────────────────────────────────────

const checkVideoProcessingStatus = (
  videoUrn: string,
  accessToken: string
): Effect.Effect<VideoStatus, ConnectionError> => {
  const encodedUrn = encodeURIComponent(videoUrn);
  return Effect.tryPromise({
    try: () =>
      axios.get(`https://api.linkedin.com/rest/videos/${encodedUrn}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": LINKEDIN_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }),
    catch: (error: unknown) => {
      console.log(
        `[LinkedIn Video] Status check failed for ${videoUrn}:`,
        error
      );
      return fromUnknownHttp(PROVIDER, error);
    },
  }).pipe(
    Effect.map((response) => {
      const status = response.data.status as VideoStatus;
      console.log(
        `[LinkedIn Video] Processing status for ${videoUrn}: ${status}`
      );
      return status;
    })
  );
};

const waitForVideoProcessing = (
  videoUrn: string,
  accessToken: string,
  attempt = 0
): Effect.Effect<void, ConnectionError> =>
  Effect.gen(function* () {
    if (attempt === 0) {
      console.log(
        `[LinkedIn Video] Starting processing wait for ${videoUrn} (max ${VIDEO_POLL_MAX_ATTEMPTS} attempts, ${VIDEO_POLL_INTERVAL_MS / 1000}s intervals)`
      );
    }
    if (attempt >= VIDEO_POLL_MAX_ATTEMPTS) {
      console.log(
        `[LinkedIn Video] Processing timeout after ${VIDEO_POLL_MAX_ATTEMPTS} attempts for ${videoUrn}`
      );
      return yield* Effect.fail(mediaProcessingTimeout(PROVIDER));
    }

    const status = yield* checkVideoProcessingStatus(videoUrn, accessToken);

    if (status === "AVAILABLE") {
      console.log(
        `[LinkedIn Video] Processing completed successfully for ${videoUrn}`
      );
      return;
    }

    if (status === "PROCESSING_FAILED") {
      console.log(`[LinkedIn Video] Processing failed for ${videoUrn}`);
      return yield* Effect.fail(
        mediaProcessingError(PROVIDER, "Video processing failed")
      );
    }

    if (status === "PROCESSING" || status === "WAITING_UPLOAD") {
      console.log(
        `[LinkedIn Video] Still processing ${videoUrn}, waiting ${VIDEO_POLL_INTERVAL_MS / 1000}s (attempt ${attempt + 1}/${VIDEO_POLL_MAX_ATTEMPTS})`
      );
      yield* Effect.sleep(Duration.millis(VIDEO_POLL_INTERVAL_MS));
      return yield* waitForVideoProcessing(videoUrn, accessToken, attempt + 1);
    }

    console.log(
      `[LinkedIn Video] Unknown processing status for ${videoUrn}: ${status}`
    );
    return yield* Effect.fail(
      mediaProcessingError(PROVIDER, `Unknown status: ${status}`)
    );
  });

// ── Post creation ─────────────────────────────────────────────────────────────

// LinkedIn's "little text format" requires reserved characters to be escaped.
// See: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/little-text-format
const LITTLE_TEXT_RESERVED = /[|{}@[\]()<>#\\*_~]/g;

function escapeLinkedInText(text: string): string {
  return text.replace(LITTLE_TEXT_RESERVED, (char) => `\\${char}`);
}

function buildLinkedInPostData(
  authorUrn: string,
  text: string,
  media: LinkedInMediaAsset[],
  contentType: PostContentType,
  options?: BuildLinkedInPostDataOptions
) {
  const basePost = {
    author: authorUrn,
    commentary: escapeLinkedInText(text),
    visibility: options?.visibility || "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  switch (contentType) {
    case "TEXT_ONLY":
      return basePost;

    case "SINGLE_IMAGE":
      return {
        ...basePost,
        content: {
          media: {
            altText: media[0]?.description || "Image",
            id: media[0]?.assetUrn,
          },
        },
      };

    case "MULTI_IMAGE":
      return {
        ...basePost,
        content: {
          multiImage: {
            images: media.map((m) => ({
              altText: m.description || "Image",
              id: m.assetUrn,
            })),
          },
        },
      };

    case "VIDEO":
      return {
        ...basePost,
        content: {
          media: {
            title: media[0]?.title || "Video",
            id: media[0]?.assetUrn,
          },
        },
      };

    case "DOCUMENT":
      return {
        ...basePost,
        content: {
          media: {
            title: media[0]?.title || "Document",
            id: media[0]?.assetUrn,
          },
        },
      };

    default:
      return basePost;
  }
}

const createAndPublishPost = (
  text: string,
  mediaAssets: LinkedInMediaAsset[],
  profile: LinkedInProfile,
  isOrg?: boolean
): Effect.Effect<{ id: string }, ConnectionError> =>
  Effect.gen(function* () {
    const authorUrn = ownerUrn(profile.profileId, isOrg ?? false);

    // Determine content type based on media.
    let contentType: PostContentType;
    if (mediaAssets.length === 0) {
      contentType = "TEXT_ONLY";
    } else if (mediaAssets[0].type === "VIDEO") {
      contentType = "VIDEO";
    } else if (mediaAssets[0].type === "DOCUMENT") {
      contentType = "DOCUMENT";
    } else if (mediaAssets.length === 1) {
      contentType = "SINGLE_IMAGE";
    } else {
      contentType = "MULTI_IMAGE";
    }

    const postData = buildLinkedInPostData(
      authorUrn,
      text,
      mediaAssets,
      contentType
    );

    const response = yield* Effect.tryPromise({
      try: () =>
        axios.post("https://api.linkedin.com/rest/posts", postData, {
          headers: jsonHeaders(profile.accessToken),
        }),
      catch: (error: unknown) => fromUnknownHttp(PROVIDER, error),
    });

    // The new API returns the post ID in the x-restli-id header.
    const postId = response.headers["x-restli-id"] || response.data?.id;
    return { id: postId as string };
  });

// ── Orchestration ─────────────────────────────────────────────────────────────

const publishContent = (
  content: SocialPublishInputType,
  profile: LinkedInProfile,
  isOrg?: boolean
): Effect.Effect<PostResult, ConnectionError> =>
  Effect.gen(function* () {
    const firstContent = content.content[0];
    if (!firstContent) {
      return yield* Effect.fail(
        invalidMedia(PROVIDER, "No content to publish")
      );
    }

    const validMedia = getValidMediaUrls(firstContent.media);
    const imageMedia = validMedia.filter(
      (media) => media.mediaType === "IMAGE" && media.url
    );
    const videoMedia = validMedia.filter(
      (media) => media.mediaType === "VIDEO" && media.url
    );
    const documentMedia = validMedia.filter(
      (media) => media.mediaType === "DOCUMENT" && media.url
    );

    console.log(
      "[LinkedIn] Processing media:",
      videoMedia.length > 0 ? `${videoMedia.length} video(s)` : "no videos",
      documentMedia.length > 0
        ? `${documentMedia.length} document(s)`
        : "no documents"
    );

    let mediaAssets: LinkedInMediaAsset[];

    if (videoMedia.length > 0) {
      // Only support one video per post for now.
      const video = videoMedia[0];
      const assetUrn = yield* uploadVideoToLinkedIn(
        video.url as string,
        profile.profileId,
        profile.accessToken,
        isOrg
      );
      // Wait for video processing to complete before proceeding.
      yield* waitForVideoProcessing(assetUrn, profile.accessToken);
      mediaAssets = [
        {
          assetUrn,
          type: "VIDEO",
          title: video.altText || "Video",
          description: "Video description",
        },
      ];
    } else if (documentMedia.length > 0) {
      // Only support one document per post.
      const doc = documentMedia[0];
      const assetUrn = yield* uploadDocumentToLinkedIn(
        doc.url as string,
        profile.profileId,
        profile.accessToken,
        isOrg
      );
      mediaAssets = [
        {
          assetUrn,
          type: "DOCUMENT",
          title: doc.altText || "Document",
          description: "Document",
        },
      ];
    } else if (imageMedia.length > 0) {
      // Support multiple images.
      const assetUrns = yield* Effect.all(
        imageMedia.map((img) =>
          uploadImageToLinkedIn(
            img.url as string,
            profile.profileId,
            profile.accessToken
          )
        )
      );
      mediaAssets = assetUrns.map((assetUrn) => ({
        assetUrn,
        type: "IMAGE",
        title: "Image",
        description: "Image description",
      }));
    } else {
      mediaAssets = [];
    }

    const postResponse = yield* createAndPublishPost(
      firstContent.text,
      mediaAssets,
      profile,
      isOrg
    );

    return {
      platformPostId: postResponse.id,
      postId: content.postId,
      platformId: profile.id,
      platformPostUrl: `https://www.linkedin.com/feed/update/${postResponse.id}`,
      postedAt: new Date(),
    } satisfies PostResult;
  });

export const linkedinPublisher: PlatformPublisher = {
  id: "LINKEDIN",
  publish: (ctx: PublishContext) =>
    getProfile(ctx.socialProviderId).pipe(
      Effect.flatMap((profile) => publishContent(ctx.content, profile))
    ),
};
