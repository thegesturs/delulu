"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import type { ProviderSetting } from "@delulu/validators/post";
import { useQuery } from "convex/react";
import { type ReactNode, useEffect, useState } from "react";
import { useStore } from "@/store/post";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch user's current social providers from database
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);

  useEffect(() => {
    if (!socialProviders) {
      return; // Wait for database query
    }

    // Rehydrate from localStorage
    useStore.persist.rehydrate();

    // Force reset transient upload state — it may be stuck from a previous session
    useStore.setState({ isMediaUploading: false });

    // Get current state after rehydration
    const state = useStore.getState();

    // Validate and clean up stale provider references
    const validProviderIds = new Set(
      socialProviders.map((provider) => provider._id)
    );

    // Filter out deleted providers from selectedSocialProviders
    const validSelectedProviders = state.selectedSocialProviders.filter(
      (provider) =>
        validProviderIds.has(provider.socialId as Id<"socialProviders">)
    );

    // Filter out deleted providers from alternative content
    const validAlternativeContent = state.post.alternativeContent.filter(
      (alt) =>
        validProviderIds.has(
          alt.socialProvider.socialId as Id<"socialProviders">
        )
    );

    // Clean up provider settings for deleted providers
    const validProviderSettings: Record<string, ProviderSetting> = {};
    for (const [providerId, setting] of Object.entries(
      state.providerSettings
    )) {
      if (validProviderIds.has(providerId as Id<"socialProviders">)) {
        validProviderSettings[providerId] = setting;
      }
    }

    // Update store with cleaned data if anything changed
    const hasChanges =
      validSelectedProviders.length !== state.selectedSocialProviders.length ||
      validAlternativeContent.length !== state.post.alternativeContent.length ||
      Object.keys(validProviderSettings).length !==
        Object.keys(state.providerSettings).length;

    if (hasChanges) {
      console.warn("[StoreProvider] Cleaned up stale provider references:", {
        removedProviders:
          state.selectedSocialProviders.length - validSelectedProviders.length,
        removedAlternativeContent:
          state.post.alternativeContent.length - validAlternativeContent.length,
        removedSettings:
          Object.keys(state.providerSettings).length -
          Object.keys(validProviderSettings).length,
      });

      useStore.setState({
        selectedSocialProviders: validSelectedProviders,
        post: {
          ...state.post,
          alternativeContent: validAlternativeContent,
        },
        providerSettings: validProviderSettings,
      });
    }

    setIsHydrated(true);
  }, [socialProviders]);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
