"use client";

import { api as ConvexApi } from "@delulu/database/convex/_generated/api";
import { Button } from "@delulu/design-system/components/ui/button";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import {
  type SupportedSocialPlatform,
  socialBackgroundColors,
  socialDisplayNames,
} from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Loading03Icon,
  RefreshIcon,
  Tick01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useOnboardingStore } from "@/store/onboarding";
import { api } from "@/trpc/react";

const ALL_SOCIAL_PLATFORMS: SupportedSocialPlatform[] = [
  "TWITTER",
  "LINKEDIN",
  "TIKTOK",
  "INSTAGRAM",
  "THREADS",
  "FACEBOOK",
  "YOUTUBE",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
} as const;

export function ConnectAccountsStep() {
  const { handleNextStep } = useOnboarding();
  const setAccountsConnected = useOnboardingStore(
    (s) => s.setAccountsConnected
  );
  const twitterEnabled = useFeatureFlag("twitter");
  const SOCIAL_PLATFORMS = ALL_SOCIAL_PLATFORMS.filter(
    (p) => p !== "TWITTER" || twitterEnabled
  );
  const limitCheck = useQuery(ConvexApi.subscriptions.checkSocialAccountLimit);
  const accounts = useQuery(ConvexApi.social_providers.getConnectedAccounts);
  const accountCount = limitCheck?.currentCount || 0;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastAccountCountRef = useRef(0);

  // Update store when accounts change + auto-advance on first connection
  useEffect(() => {
    setAccountsConnected(accountCount);

    // Show brief refresh indicator when account count increases
    if (accountCount > lastAccountCountRef.current) {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);

      // Auto-advance to step 3 after first account is connected
      if (accountCount === 1 && lastAccountCountRef.current === 0) {
        // Give user 2 seconds to see success state, then advance
        setTimeout(() => {
          handleNextStep();
        }, 2000);
      }
    }
    lastAccountCountRef.current = accountCount;
  }, [accountCount, setAccountsConnected, handleNextStep]);

  // CRITICAL FIX: Auto-refresh when page becomes visible (after OAuth redirect)
  // Convex useQuery automatically refetches when page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsRefreshing(true);
        // Convex will automatically refetch, we just show loading state
        setTimeout(() => setIsRefreshing(false), 1500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Convex useQuery will automatically refetch on next render cycle
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
          Connect Your Social Accounts
        </h2>
        <p className="text-lg text-muted-foreground tracking-tight">
          Connect at least one account to start posting
        </p>
        <p className="text-muted-foreground text-sm">
          All connections use official platform APIs — your passwords never
          touch our servers.
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1 font-medium text-muted-foreground text-sm backdrop-blur-sm">
            {isRefreshing && (
              <Icon className="animate-spin" icon={Loading03Icon} size={14} />
            )}
            <span>
              {accountCount} of {SOCIAL_PLATFORMS.length} accounts connected
            </span>
          </div>
          <Button
            className="h-7"
            disabled={isRefreshing}
            onClick={handleManualRefresh}
            size="sm"
            variant="ghost"
          >
            <Icon
              className={isRefreshing ? "animate-spin" : ""}
              icon={RefreshIcon}
              size={14}
            />
          </Button>
        </div>
      </motion.div>

      {/* Platform Grid */}
      <motion.div
        animate="visible"
        className="grid gap-4 sm:grid-cols-2"
        initial="hidden"
        variants={containerVariants}
      >
        {SOCIAL_PLATFORMS.map((platform) => (
          <PlatformCard
            isAtLimit={!limitCheck?.allowed}
            isConnected={accounts?.some((acc) => acc.socialType === platform)}
            key={platform}
            platform={platform}
          />
        ))}
      </motion.div>
    </div>
  );
}

function PlatformCard({
  platform,
  isConnected,
  isAtLimit,
}: {
  platform: SupportedSocialPlatform;
  isConnected?: boolean;
  isAtLimit?: boolean;
}) {
  // Don't fetch connection URL if already connected OR at limit
  const {
    data: connectUrl,
    isLoading,
    error,
  } = api.socialProvider.getSocialProviderConnectUrl.useQuery(
    { provider: platform },
    {
      enabled: !(isConnected || isAtLimit), // Only fetch if not connected AND not at limit
      retry: 1, // Only retry once instead of multiple times
      retryDelay: 1000, // Wait 1 second before retry
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const cardContent = (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center space-x-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${socialBackgroundColors[platform]} shadow-sm transition-transform group-hover:scale-105`}
        >
          <SocialIcon className="text-white" size="md" type={platform} />
        </div>
        <span className="font-semibold tracking-tight">
          {socialDisplayNames[platform]}
        </span>
      </div>
      <ActionStatus
        hasError={!!error}
        isConnected={isConnected}
        isLoading={isLoading}
      />
    </div>
  );

  const containerClass = `group flex h-20 w-full items-center rounded-lg border px-5 transition-all duration-200 ${
    isConnected
      ? "border-border bg-muted/30 opacity-80"
      : "border-border bg-card hover:border-primary/20 hover:bg-accent/50 hover:shadow-sm"
  }`;

  // Show upgrade prompt if at limit
  if (isAtLimit && !isConnected) {
    return (
      <motion.div variants={itemVariants}>
        <div className={containerClass}>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${socialBackgroundColors[platform]} shadow-sm`}
              >
                <SocialIcon className="text-white" size="md" type={platform} />
              </div>
              <span className="font-semibold tracking-tight">
                {socialDisplayNames[platform]}
              </span>
            </div>
            <Link
              className="text-primary text-sm hover:underline"
              href="/settings/billing"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show non-clickable card if: connected, loading, error, or no URL
  if (isConnected || isLoading || error || !connectUrl) {
    return (
      <motion.div variants={itemVariants}>
        <div className={containerClass}>{cardContent}</div>
      </motion.div>
    );
  }

  // Show clickable link only when we have a valid URL
  return (
    <motion.div variants={itemVariants}>
      <Link className={containerClass} href={connectUrl}>
        {cardContent}
      </Link>
    </motion.div>
  );
}

function ActionStatus({
  isConnected,
  isLoading,
  hasError,
}: {
  isConnected?: boolean;
  isLoading: boolean;
  hasError?: boolean;
}) {
  if (isConnected) {
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" icon={Tick01Icon} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Icon
        className="animate-spin text-muted-foreground"
        icon={Loading03Icon}
        size={20}
      />
    );
  }

  if (hasError) {
    return (
      <span className="font-medium text-muted-foreground/60 text-xs">
        Unavailable
      </span>
    );
  }

  return (
    <span className="font-medium text-muted-foreground text-sm transition-colors group-hover:text-primary">
      Connect
    </span>
  );
}
