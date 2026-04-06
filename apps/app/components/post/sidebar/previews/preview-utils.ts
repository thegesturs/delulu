"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { useQuery } from "convex-helpers/react/cache";
import { useMediaUrl } from "@/hooks/use-media-url";
import { usePost, useSelectedSocialProviders } from "@/store/post";

export function formatNumber(num: number) {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Preview data hook. When `postData` is provided, derives preview data from the
 * post object (used in review flow). Otherwise reads from the Zustand store
 * (used in the post editor).
 */
export function usePreviewData(
  socialType: SupportedSocialPlatform,
  postData?: {
    content: Array<{
      text: string;
      media: Array<{
        url?: string;
        bucketKey?: string;
        mediaType: "IMAGE" | "VIDEO";
        altText?: string;
      }>;
    }>;
    socialProviders?: Array<{
      _id: string;
      socialType: string;
      username?: string;
      fullName?: string;
      profileImage?: string;
    }>;
  }
) {
  const storePost = usePost();
  const selectedProviders = useSelectedSocialProviders();
  const connectedAccounts = useQuery(api.social_providers.getConnectedAccounts);

  // When post data is passed, derive from it instead of the store
  if (postData) {
    const content = postData.content[0];
    const media = content?.media?.[0];
    const mediaUrl = useMediaUrl(media?.bucketKey, media?.url);
    const hasVideo = media?.mediaType === "VIDEO";
    const hasImage = media?.mediaType === "IMAGE";

    const provider = postData.socialProviders?.find(
      (p) => p.socialType === socialType
    );

    return {
      content,
      media,
      mediaUrl,
      hasVideo,
      hasImage,
      provider: provider
        ? (connectedAccounts?.find((a) => a._id === provider._id) ?? provider)
        : undefined,
    };
  }

  const selectedProvider = selectedProviders.find(
    (provider) => provider.socialType === socialType
  );

  const provider = connectedAccounts?.find(
    (account) => account._id === selectedProvider?.socialId
  );

  const content = storePost.content[0];
  const media = content?.media?.[0];
  const mediaUrl = useMediaUrl(media?.bucketKey, media?.url);
  const hasVideo = media?.mediaType === "VIDEO";
  const hasImage = media?.mediaType === "IMAGE";

  return {
    content,
    media,
    mediaUrl,
    hasVideo,
    hasImage,
    provider,
  };
}
