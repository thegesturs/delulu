"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";
import { useMediaUrl } from "@/hooks/use-media-url";
import { usePost, useSelectedSocialProviders } from "@/store/post";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";

export function formatNumber(num: number) {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function usePreviewData(socialType: SupportedSocialPlatform) {
  const post = usePost();
  const selectedProviders = useSelectedSocialProviders();
  const connectedAccounts = useQuery(api.social_providers.getConnectedAccounts);

  const selectedProvider = selectedProviders.find(
    (provider) => provider.socialType === socialType
  );

  const provider = connectedAccounts?.find(
    (account) => account._id === selectedProvider?.socialId
  );

  const content = post.content[0];
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
