"use client";

import { useAnalytics } from "@delulu/analytics/posthog/client";
import { useUser } from "@delulu/auth";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function PostHogIdentifierContent() {
  const { user } = useUser();
  const identified = useRef(false);
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

    identified.current = true;
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
