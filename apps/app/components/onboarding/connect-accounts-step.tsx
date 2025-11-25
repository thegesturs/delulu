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
import { useQuery } from 'convex-helpers/react/cache';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect } from 'react';

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

  // Update store when accounts change
  useEffect(() => {
    setAccountsConnected(accountCount);
  }, [accountCount, setAccountsConnected]);

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
        <div className="inline-flex items-center rounded-lg border bg-muted/50 px-3 py-1 font-medium text-muted-foreground text-sm backdrop-blur-sm">
          {accountCount} of {SOCIAL_PLATFORMS.length} accounts connected
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
  const { data: connectUrl, isLoading } =
    api.socialProvider.getSocialProviderConnectUrl.useQuery({
      provider: platform,
    });

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
      <ActionStatus isConnected={isConnected} isLoading={isLoading} />
    </div>
  );

  const containerClass = `group flex h-20 w-full items-center rounded-lg border px-5 transition-all duration-200 ${
    isConnected
      ? 'border-border bg-muted/30 opacity-80'
      : 'border-border bg-card hover:border-primary/20 hover:bg-accent/50 hover:shadow-sm'
  }`;

  if (isConnected || isLoading || !connectUrl) {
    return (
      <motion.div variants={itemVariants}>
        <div className={containerClass}>{cardContent}</div>
      </motion.div>
    );
  }

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
}: { isConnected?: boolean; isLoading: boolean }) {
  if (isConnected) {
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-4" />
      </div>
    );
  }

  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  return (
    <span className="font-medium text-muted-foreground text-sm transition-colors group-hover:text-primary">
      Connect
    </span>
  );
}
