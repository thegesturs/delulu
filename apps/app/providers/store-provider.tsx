"use client";

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useStore } from "@/store/post";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { resources } = useApiClient();
  const { workspaceId } = useWorkspace();

  const connections = useQuery({
    ...resources.connections.list(workspaceId ?? "", {}),
    enabled: workspaceId !== null,
  });

  useEffect(() => {
    const socialProviders = connections.data?.data;
    if (!socialProviders) {
      return;
    }

    // Rehydrate from localStorage
    useStore.persist.rehydrate();

    // Force reset transient upload state — it may be stuck from a previous session
    useStore.setState({ isMediaUploading: false });

    // Get current state after rehydration
    const state = useStore.getState();

    // Validate and clean up stale provider references
    const validProviderIds = new Set(
      socialProviders.map((provider) => provider.id)
    );

    // Filter out deleted providers from selectedSocialProviders
    const validSelectedProviders = state.selectedSocialProviders.filter(
      (provider) => validProviderIds.has(provider.socialId)
    );

    // Filter out deleted providers from alternative content
    const validAlternativeContent = state.post.alternativeContent.filter(
      (alt) => validProviderIds.has(alt.socialProvider.socialId)
    );

    // Clean up provider settings for deleted providers
    const validProviderSettings: typeof state.providerSettings = {};
    for (const [providerId, setting] of Object.entries(
      state.providerSettings
    )) {
      if (validProviderIds.has(providerId)) {
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
  }, [connections.data]);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
