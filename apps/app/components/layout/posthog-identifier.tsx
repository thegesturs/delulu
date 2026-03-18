"use client";

import { useAnalytics } from "@delulu/analytics/posthog/client";
import {
  SIGNUP_COMPLETED,
  SESSION_STARTED,
  FEATURE_USED,
} from "@delulu/analytics/events";
import { useUser } from "@delulu/auth";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

// Map pathname segments to human-readable feature names for tracking
function getFeatureFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const featureMap: Record<string, string> = {
    post: "post_creator",
    posts: "posts_list",
    socials: "connected_accounts",
    automations: "automations",
    calendar: "calendar",
    settings: "settings",
    affiliates: "affiliates",
    analytics: "analytics_dashboard",
  };
  for (const segment of segments) {
    if (featureMap[segment]) {
      return featureMap[segment];
    }
  }
  return null;
}

function PostHogIdentifierContent() {
  const { user } = useUser();
  const identified = useRef(false);
  const sessionTracked = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();

  useEffect(() => {
    // Track pageviews
    if (pathname && analytics) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      analytics.capture("$pageview", {
        $current_url: url,
      });

      // Track feature usage based on navigation
      const feature = getFeatureFromPath(pathname);
      if (feature) {
        analytics.capture(FEATURE_USED, {
          feature,
          path: pathname,
        });
      }
    }
  }, [pathname, searchParams, analytics]);

  useEffect(() => {
    if (!user || identified.current) {
      return;
    }

    analytics.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      createdAt: user.createdAt,
      avatar: user.imageUrl,
    });

    // Detect new signups: user created within the last 60 seconds
    const createdAt = user.createdAt
      ? new Date(user.createdAt).getTime()
      : null;
    if (createdAt && Date.now() - createdAt < 60_000) {
      analytics.capture(SIGNUP_COMPLETED, {
        method: user.primaryEmailAddress ? "email" : "oauth",
        email: user.primaryEmailAddress?.emailAddress,
      });
      analytics.people?.set({
        signup_date: new Date(createdAt).toISOString(),
      });
    }

    identified.current = true;
  }, [user, analytics]);

  // Track session start (once per page load / app open)
  useEffect(() => {
    if (!user || !analytics || sessionTracked.current) {
      return;
    }
    sessionTracked.current = true;

    analytics.capture(SESSION_STARTED, {
      returning_user: user.createdAt
        ? Date.now() - new Date(user.createdAt).getTime() > 24 * 60 * 60 * 1000
        : false,
      days_since_signup: user.createdAt
        ? Math.floor(
            (Date.now() - new Date(user.createdAt).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : null,
    });
  }, [user, analytics]);

  return null;
}

export const PostHogIdentifier = () => {
  return (
    <Suspense>
      <PostHogIdentifierContent />
    </Suspense>
  );
};
