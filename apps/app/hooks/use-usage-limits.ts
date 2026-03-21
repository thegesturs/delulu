/**
 * useUsageLimits Hook
 *
 * Checks usage limits for the current user's plan
 */

import { api } from "@delulu/database/convex/_generated/api";
import type { PlanType } from "@delulu/payments";
import { useQuery } from "convex-helpers/react/cache";

export type LimitType =
  | "socialAccounts"
  | "monthlyPosts"
  | "mediaStorage"
  | "teamMembers"
  | "organizations";

export interface UseUsageLimitReturn {
  allowed: boolean;
  limit: number; // -1 for unlimited
  remaining: number; // -1 for unlimited
  planType: PlanType;
  isLoading: boolean;
  isUnlimited: boolean;
  percentageUsed: number; // 0-100, or -1 for unlimited
}

export function useUsageLimit(
  limitType: LimitType,
  currentValue: number
): UseUsageLimitReturn {
  const limitCheck = useQuery(api.subscriptions.checkUsageLimit, {
    limitType,
    currentValue,
  });

  const isLoading = limitCheck === undefined;
  const limit = limitCheck?.limit ?? 0;
  const remaining = limitCheck?.remaining ?? 0;
  const isUnlimited = limit === -1;

  // Calculate percentage used
  let percentageUsed = -1;
  if (!isUnlimited && limit > 0) {
    percentageUsed = Math.min(100, Math.round((currentValue / limit) * 100));
  }

  return {
    allowed: limitCheck?.allowed ?? false,
    limit,
    remaining,
    planType: limitCheck?.planType || "FREE",
    isLoading,
    isUnlimited,
    percentageUsed,
  };
}

/**
 * Hook to check multiple limits at once
 */
export function useMultipleUsageLimits(
  limits: Array<{ type: LimitType; currentValue: number }>
) {
  const results = limits.map(({ type, currentValue }) =>
    useUsageLimit(type, currentValue)
  );

  return {
    limits: Object.fromEntries(
      limits.map(({ type }, index) => [type, results[index]])
    ),
    allAllowed: results.every((r) => r.allowed),
    someBlocked: results.some((r) => !r.allowed),
    isLoading: results.some((r) => r.isLoading),
  };
}

/**
 * Helper hook for social accounts limit
 */
export function useSocialAccountsLimit(currentCount: number) {
  return useUsageLimit("socialAccounts", currentCount);
}

/**
 * Helper hook for monthly posts limit
 */
export function useMonthlyPostsLimit(currentCount: number) {
  return useUsageLimit("monthlyPosts", currentCount);
}

/**
 * Helper hook for media storage limit
 */
export function useMediaStorageLimit(currentUsageMB: number) {
  return useUsageLimit("mediaStorage", currentUsageMB);
}

/**
 * Helper hook for team members limit
 */
export function useTeamMembersLimit(currentCount: number) {
  return useUsageLimit("teamMembers", currentCount);
}
