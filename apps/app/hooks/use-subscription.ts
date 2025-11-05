/**
 * useSubscription Hook
 *
 * Provides access to the current user's subscription information
 */

import { useQuery } from 'convex/react';
import { api } from '@delulu/database/convex/_generated/api';
import type { PlanType } from '@delulu/payments';

export interface UseSubscriptionReturn {
  subscription: any | null | undefined;
  planType: PlanType;
  isActive: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  isTrialing: boolean;
  isFree: boolean;
  isStarter: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  isPaid: boolean;
  isLoading: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const subscription = useQuery(api.subscriptions.getCurrentSubscription);

  const planType: PlanType = subscription?.planType || 'FREE';
  const isLoading = subscription === undefined;

  return {
    subscription,
    planType,
    isActive: subscription?.status === 'ACTIVE',
    isPastDue: subscription?.status === 'PAST_DUE',
    isCancelled: subscription?.status === 'CANCELLED',
    isTrialing: subscription?.status === 'TRIALING',
    isFree: planType === 'FREE',
    isStarter: planType === 'STARTER',
    isPro: planType === 'PRO',
    isEnterprise: planType === 'ENTERPRISE',
    isPaid: planType !== 'FREE',
    isLoading,
    currentPeriodEnd: subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
  };
}
