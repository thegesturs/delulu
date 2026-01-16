'use client';

import { useOnboardingStore } from '@/store/onboarding';
import { api } from '@/trpc/react';
import { api as ConvexApi } from '@delulu/database/convex/_generated/api';
import { SocialIcon } from '@delulu/design-system/components/ui/social-icon';
import {
  type SupportedSocialPlatform,
  socialBackgroundColors,
  socialDisplayNames,
} from '@delulu/design-system/lib/social-config';
import { Icon } from '@delulu/design-system/providers/icon';
import { useQuery } from 'convex-helpers/react/cache';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  Loading03Icon,
  RefreshIcon,
  Tick01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const SOCIAL_PLATFORMS: SupportedSocialPlatform[] = [
  'LINKEDIN',
  'TIKTOK',
  'INSTAGRAM',
  'THREADS',
  'FACEBOOK',
  'YOUTUBE',
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
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
} as const;

export function ConnectAccountsStep() {
  const { setAccountsConnected } = useOnboardingStore();
  const accounts = useQuery(ConvexApi.social_providers.getConnectedAccounts);
  const accountCount = accounts?.length || 0;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastAccountCount, setLastAccountCount] = useState(0);

  // Update store when accounts change
  useEffect(() => {
    setAccountsConnected(accountCount);

    // Show brief refresh indicator when account count increases
    if (accountCount > lastAccountCount) {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }
    setLastAccountCount(accountCount);
  }, [accountCount, setAccountsConnected, lastAccountCount]);

  // CRITICAL FIX: Auto-refresh when page becomes visible (after OAuth redirect)
  // Convex useQuery automatically refetches when page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsRefreshing(true);
        // Convex will automatically refetch, we just show loading state
        setTimeout(() => setIsRefreshing(false), 1500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-4 text-center"
      >
        <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
          Connect Your Social Accounts
        </h2>
        <p className="text-lg text-muted-foreground tracking-tight">
          Connect at least one account to start posting
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1 font-medium text-muted-foreground text-sm backdrop-blur-sm">
            {isRefreshing && (
              <Icon icon={Loading03Icon} size={14} className="animate-spin" />
            )}
            <span>
              {accountCount} of {SOCIAL_PLATFORMS.length} accounts connected
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-7"
          >
            <Icon
              icon={RefreshIcon}
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
            />
          </Button>
        </div>
      </motion.div>

      {/* Platform Grid */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {SOCIAL_PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            isConnected={accounts?.some((acc) => acc.socialType === platform)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function PlatformCard({
  platform,
  isConnected,
}: {
  platform: SupportedSocialPlatform;
  isConnected?: boolean;
}) {
  // Don't fetch connection URL if already connected
  const {
    data: connectUrl,
    isLoading,
    error,
  } = api.socialProvider.getSocialProviderConnectUrl.useQuery(
    { provider: platform },
    {
      enabled: !isConnected, // Only fetch if not connected
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
          <SocialIcon type={platform} size="md" className="text-white" />
        </div>
        <span className="font-semibold tracking-tight">
          {socialDisplayNames[platform]}
        </span>
      </div>
      <ActionStatus
        isConnected={isConnected}
        isLoading={isLoading}
        hasError={!!error}
      />
    </div>
  );

  const containerClass = `group flex h-20 w-full items-center rounded-lg border px-5 transition-all duration-200 ${
    isConnected
      ? 'border-border bg-muted/30 opacity-80'
      : 'border-border bg-card hover:border-primary/20 hover:bg-accent/50 hover:shadow-sm'
  }`;

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
      <Link href={connectUrl} className={containerClass}>
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
        <Icon icon={Tick01Icon} className="size-4" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Icon
        icon={Loading03Icon}
        size={20}
        className=" animate-spin text-muted-foreground"
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
