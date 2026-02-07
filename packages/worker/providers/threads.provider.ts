import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { convex } from "@delulu/database/node";
import type { MediaType } from "@delulu/validators/post";
import { getValidMediaUrls } from "@delulu/validators/post";
import axios from "axios";
import {
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
  ResultAsync,
} from "neverthrow";
import { keys } from "../key";

import type {
  BaseProviderProfile,
  PostContent,
  PostPublishResult,
  ThreadsMediaContainer,
  ThreadsMediaPublishResponse,
  ThreadsMediaResponse,
} from "./common-types";
import {
  createAPIError,
  MediaProcessingError,
  MediaProcessingTimeoutError,
  NoContentError,
  ProfileNotFoundError,
  type SocialProviderError,
  ThreadsError,
} from "./errors";
import type { SocialProvider } from "./types";

const urlRegex =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<BaseProviderProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    convex.query(api.social_providers.getSocialProviderWithDecryptedTokens, {
      id: socialProviderId as Id<"socialProviders">,
    }),
    () => new ThreadsError("Database query failed")
  ).andThen((profile) => {
    if (!(profile?.accessToken && profile.profileId)) {
      return err(new ProfileNotFoundError("Threads"));
    }
    return ok({
      id: profile._id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
      username: profile.username!,
    });
  });

// Media container creation
const createMediaContainer = (
  media: MediaType | null,
  profile: BaseProviderProfile,
  text: string,
  options: {
    isCarouselItem?: boolean;
    replyToId?: string;
  } = {}
): ResultAsync<ThreadsMediaContainer, SocialProviderError> => {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    text,
  });

  if (media?.url) {
    const mediaType = media.mediaType === "VIDEO" ? "VIDEO" : "IMAGE";
    params.append("media_type", mediaType);
    params.append(mediaType === "VIDEO" ? "video_url" : "image_url", media.url);
    if (options.isCarouselItem) {
      params.append("is_carousel_item", "true");
    }
  } else {
    params.append("media_type", "TEXT");
    // Extract first URL from text for link preview
    const urlMatch = text.match(urlRegex);
    if (urlMatch) {
      params.append("link_attachment", urlMatch[0]);
    }
  }

  if (options.replyToId) {
    params.append("reply_to_id", options.replyToId);
  }

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error) => createAPIError("Threads", error)
  ).map((response) => response.data);
};

const createCarouselContainer = (
  childrenIds: string[],
  profile: BaseProviderProfile,
  text: string
): ResultAsync<ThreadsMediaContainer, SocialProviderError> => {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads`;
  const params = new URLSearchParams({
    access_token: profile.accessToken,
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
    text,
  });

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error) => createAPIError("Threads", error)
  ).map((response) => response.data);
};

const waitForContainerProcessing = (
  containerId: string,
  accessToken: string,
  maxAttempts = 30,
  delay = 3000
): ResultAsync<void, SocialProviderError> => {
  const poll = async (
    attempts: number
  ): Promise<Result<void, SocialProviderError>> => {
    if (attempts >= maxAttempts) {
      return err(new MediaProcessingTimeoutError("Threads"));
    }

    const statusResult = await ResultAsync.fromPromise(
      axios.get(`https://graph.threads.net/v1.0/${containerId}`, {
        params: { access_token: accessToken },
      }),
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 500) {
          return new MediaProcessingError(
            "Threads",
            "Server error - container still processing"
          );
        }
        return createAPIError("Threads", error);
      }
    );

    if (statusResult.isErr()) {
      if (statusResult.error instanceof MediaProcessingError) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return poll(attempts + 1);
      }
      return err(statusResult.error);
    }

    const status = statusResult.value.data.status;
    if (status === "FINISHED") {
      return ok(undefined);
    }

    if (status === "ERROR" || status === "EXPIRED") {
      return err(
        new MediaProcessingError(
          "Threads",
          `Media processing failed: ${statusResult.value.data.error_message || status}`
        )
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return poll(attempts + 1);
  };

  return ResultAsync.fromPromise(
    poll(0),
    (error) => error as SocialProviderError
  ).andThen((result) => {
    if (result.isErr()) {
      return errAsync(result.error);
    }
    return okAsync(result.value);
  });
};

const publishContainer = (
  creationId: string,
  profile: BaseProviderProfile
): ResultAsync<ThreadsMediaPublishResponse, SocialProviderError> => {
  const endpoint = `https://graph.threads.net/v1.0/${profile.profileId}/threads_publish`;
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: profile.accessToken,
  });

  return ResultAsync.fromPromise(
    axios.post(`${endpoint}?${params.toString()}`),
    (error) => createAPIError("Threads", error)
  ).map((response) => response.data);
};

const getPostDetails = (
  mediaId: string,
  accessToken: string
): ResultAsync<ThreadsMediaResponse, SocialProviderError> => {
  return ResultAsync.fromPromise(
    axios.get<ThreadsMediaResponse>(
      `https://graph.threads.net/v1.0/${mediaId}`,
      {
        params: {
          fields: "id,permalink,link_attachment_url",
          access_token: accessToken,
        },
      }
    ),
    (error) => createAPIError("Threads", error)
  ).map((response) => response.data);
};

// Process single post content
const processPostContent = (
  post: PostContent,
  profile: BaseProviderProfile,
  replyToId?: string
): ResultAsync<string, SocialProviderError> => {
  const validMedia = getValidMediaUrls(post.media);

  if (validMedia.length > 1) {
    // Carousel post
    return ResultAsync.combine(
      validMedia.map((media) =>
        createMediaContainer(media, profile, post.text, {
          isCarouselItem: true,
        })
      )
    ).andThen((itemContainers) => {
      const itemIds = itemContainers.map((container) => container.id);
      return createCarouselContainer(itemIds, profile, post.text).andThen(
        (carouselContainer) =>
          waitForContainerProcessing(carouselContainer.id, profile.accessToken)
            .andThen(() => publishContainer(carouselContainer.id, profile))
            .map((publishResponse) => publishResponse.id)
      );
    });
  }

  // Single media or text-only post
  const media = validMedia[0] || null;
  return createMediaContainer(media, profile, post.text, { replyToId }).andThen(
    (container) =>
      waitForContainerProcessing(container.id, profile.accessToken)
        .andThen(() => publishContainer(container.id, profile))
        .map((publishResponse) => publishResponse.id)
  );
};

// Main publish function
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: BaseProviderProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const posts = content.content.sort((a, b) => a.order - b.order);

  if (posts.length === 0) {
    return errAsync(new NoContentError("Threads"));
  }

  // Process posts sequentially to maintain thread order
  const processSequentially = (
    remainingPosts: PostContent[],
    lastPostId?: string
  ): ResultAsync<
    { postId: string; details: ThreadsMediaResponse },
    SocialProviderError
  > => {
    const [currentPost, ...nextPosts] = remainingPosts;

    return processPostContent(currentPost, profile, lastPostId)
      .andThen((postId) =>
        getPostDetails(postId, profile.accessToken).map((details) => ({
          postId,
          details,
        }))
      )
      .andThen((result) => {
        if (nextPosts.length > 0) {
          return processSequentially(nextPosts, result.postId);
        }
        return ResultAsync.fromPromise(
          Promise.resolve(result),
          () => new ThreadsError("Should never happen")
        );
      });
  };

  return processSequentially(posts).map(({ postId, details }) => ({
    platformPostId: postId,
    postId: content.postId,
    platformId: profile.id,
    platformPostUrl: details.permalink,
    postedAt: new Date(),
  }));
};

// Provider implementation
export const threadsProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },

  connectUrl: () => {
    const params = new URLSearchParams({
      client_id: keys().THREADS_CLIENT_ID,
      redirect_uri: keys().THREADS_CALLBACK_URL,
      response_type: "code",
      scope: [
        "threads_basic",
        "threads_content_publish",
        "threads_read_replies",
        "threads_manage_replies",
        "threads_manage_insights",
      ].join(","),
    });

    return `https://threads.net/oauth/authorize?${params.toString()}`;
  },
};
