"use client";

import type { ReactNode } from "react";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

type FeatureFlag = "affiliates" | "twitter";

export function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const enabled = useFeatureFlag(flag);
  if (enabled) {
    return children;
  }
  return fallback;
}
