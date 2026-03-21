/**
 * useSubscription Hook
 *
 * Provides access to the current user's subscription information
 */

import { api } from "@delulu/database/convex/_generated/api";
import type { Doc } from "@delulu/database/convex/_generated/dataModel";
import type { PlanType } from "@delulu/payments";
import { useQuery } from "convex-helpers/react/cache";

export interface UseSubscriptionReturn {
  subscription: Doc<"subscriptions"> | null | undefined;
  planType: PlanType;
  billingPeriod: "MONTHLY" | "YEARLY" | "LIFETIME" | null;
  isActive: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  isTrialing: boolean;
  isFree: boolean;
  isVibe: boolean;
  isEcho: boolean;
  isPaid: boolean;
  isLifetime: boolean;
  isLoading: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | undefined;
}

export function useSubscription(): UseSubscriptionReturn {
  const subscription = useQuery(api.subscriptions.getCurrentSubscription);

  const planType: PlanType = subscription?.planType || "FREE";
  const isLoading = subscription === undefined;

  return {
    subscription,
    planType,
    billingPeriod: subscription?.billingPeriod || null,
    isActive: subscription?.status === "ACTIVE",
    isPastDue: subscription?.status === "PAST_DUE",
    isCancelled: subscription?.status === "CANCELLED",
    isTrialing: subscription?.status === "TRIALING",
    isFree: planType === "FREE",
    isVibe: planType === "VIBE",
    isEcho: planType === "ECHO",
    isPaid: planType !== "FREE",
    isLifetime: subscription?.billingPeriod === "LIFETIME",
    isLoading,
    currentPeriodEnd: subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
  };
}
