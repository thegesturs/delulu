/**
 * useFeatureAccess Hook
 *
 * Checks if the current user has access to a specific feature based on their plan
 */

import { api } from "@delulu/database/convex/_generated/api";
import type { PlanType } from "@delulu/payments";
import { useQuery } from "convex/react";

export type Feature = "postScheduling" | "prioritySupport";

export interface UseFeatureAccessReturn {
  hasAccess: boolean;
  needsUpgrade: boolean;
  planType: PlanType;
  isLoading: boolean;
  isChecking: boolean;
}

export function useFeatureAccess(feature: Feature): UseFeatureAccessReturn {
  const access = useQuery(api.subscriptions.checkFeatureAccess, { feature });

  const isLoading = access === undefined;
  const isChecking = access === null;

  return {
    hasAccess: access?.hasAccess ?? false,
    needsUpgrade: access?.needsUpgrade ?? true,
    planType: access?.planType || "FREE",
    isLoading,
    isChecking,
  };
}

/**
 * Helper hook to check multiple features at once
 */
export function useMultipleFeatureAccess(features: Feature[]) {
  const results = features.map((feature) => useFeatureAccess(feature));

  return {
    features: Object.fromEntries(
      features.map((feature, index) => [feature, results[index]])
    ),
    allGranted: results.every((r) => r.hasAccess),
    someGranted: results.some((r) => r.hasAccess),
    isLoading: results.some((r) => r.isLoading),
  };
}
