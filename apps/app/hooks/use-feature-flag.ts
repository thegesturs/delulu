"use client";

import { useUser } from "@delulu/auth";

const ADMIN_EMAILS = ["rajswaraj.r@gmail.com", "mrfranklinstein@gmail.com"];

type FeatureFlag = "affiliates" | "analytics";

const FLAG_CONFIG: Record<FeatureFlag, { adminOnly: boolean }> = {
  affiliates: { adminOnly: true },
  analytics: { adminOnly: true },
};

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { user } = useUser();
  const config = FLAG_CONFIG[flag];

  if (!config) {
    return false;
  }

  if (config.adminOnly) {
    const email = user?.primaryEmailAddress?.emailAddress;
    return !!email && ADMIN_EMAILS.includes(email);
  }

  return true;
}

export function useIsAdmin(): boolean {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  return !!email && ADMIN_EMAILS.includes(email);
}
