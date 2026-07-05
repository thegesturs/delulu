"use client";

import { useUser } from "@delulu/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";

const ALLOWED_WITHOUT_SUBSCRIPTION = ["/billing", "/onboarding"];

/**
 * Redirects users without an active paid subscription to billing.
 * Lifetime and paid plans (ECHO/VIBE) pass through.
 */
export function PaidSubscriptionGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { isPaid, isLifetime, isLoading } = useSubscription();

  const onboardingComplete = (
    user?.publicMetadata as { onboardingComplete?: boolean } | undefined
  )?.onboardingComplete;

  const hasAccess = isPaid || isLifetime;
  const isAllowedRoute =
    ALLOWED_WITHOUT_SUBSCRIPTION.some((route) => pathname.startsWith(route)) ||
    (!onboardingComplete && pathname.startsWith("/automations"));

  useEffect(() => {
    if (isLoading || hasAccess || isAllowedRoute) {
      return;
    }
    router.replace("/billing");
  }, [hasAccess, isAllowedRoute, isLoading, router]);

  if (isLoading || hasAccess || isAllowedRoute) {
    return null;
  }

  return null;
}