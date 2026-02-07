"use client";

import type { PostHog } from "posthog-js";
import posthog from "posthog-js";
import { PostHogProvider as PostHogProviderRaw } from "posthog-js/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { keys } from "../keys";

interface PostHogProviderProps {
  readonly children: ReactNode;
}

export const PostHogProvider = (
  properties: Omit<PostHogProviderProps, "client">
) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initPostHog = async () => {
      const posthogKey = keys().NEXT_PUBLIC_POSTHOG_KEY;
      let apiHost = keys().NEXT_PUBLIC_POSTHOG_HOST;
      const proxyHost = keys().NEXT_PUBLIC_POSTHOG_PROXY_HOST;

      // Smart fallback: Try direct PostHog host first, fallback to proxy if blocked
      if (proxyHost) {
        try {
          await fetch(apiHost, { method: "HEAD", mode: "no-cors" });
        } catch (_error) {
          // Direct host blocked, use Cloudflare proxy
          apiHost = proxyHost;
        }
      }

      posthog.init(posthogKey, {
        api_host: apiHost,
        ui_host: keys().NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true, // Overrides the `capture_pageview` setting
      }) as PostHog;

      setIsInitialized(true);
    };

    if (!isInitialized) {
      initPostHog();
    }
  }, [isInitialized]);

  return <PostHogProviderRaw client={posthog} {...properties} />;
};

export { posthog } from "posthog-js";
export { usePostHog as useAnalytics } from "posthog-js/react";
