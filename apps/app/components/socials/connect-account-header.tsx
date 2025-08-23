'use client';

import type { SocialType } from '@delulu/database/convex/utils';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@delulu/design-system/components/ui/dialog';
import { SocialIcon } from '@delulu/design-system/components/ui/social-icon';
import {
  type SupportedSocialPlatform,
  socialBackgroundColors,
  socialDescriptions,
  socialDisplayNames,
} from '@delulu/design-system/lib/social-config';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import type { JSX } from 'react';

const SOCIAL_PLATFORMS: SupportedSocialPlatform[] = [
  // 'TWITTER',
  'LINKEDIN',
  'TIKTOK',
  'INSTAGRAM',
  'THREADS',
  'FACEBOOK',
  // 'PINTEREST',
  // 'FARCASTER',
  'YOUTUBE',
];

function ConnectPlatformButton({ platform }: { platform: SupportedSocialPlatform }) {
  const { data: connectUrl, isLoading } = api.socialProvider.getSocialProviderConnectUrl.useQuery({
    provider: platform,
  });

  if (platform === 'FARCASTER') {
    return (
      <Button
        className="flex h-14 items-center justify-start space-x-4 px-4"
        variant="outline"
        disabled
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            socialBackgroundColors[platform]
          } shadow-sm`}
        >
          <SocialIcon
            type={platform}
            size="md"
            className="text-white"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">
            {socialDisplayNames[platform]}
          </span>
          <span className="text-muted-foreground text-sm">
            {socialDescriptions[platform]}
          </span>
        </div>
      </Button>
    );
  }

  if (isLoading || !connectUrl) {
    return (
      <Button
        className="flex h-14 items-center justify-start space-x-4 px-4"
        variant="outline"
        disabled
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            socialBackgroundColors[platform]
          } shadow-sm`}
        >
          <SocialIcon
            type={platform}
            size="md"
            className="text-white"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">
            {socialDisplayNames[platform]}
          </span>
          <span className="text-muted-foreground text-sm">
            {socialDescriptions[platform]}
          </span>
        </div>
      </Button>
    );
  }

  return (
    <Button asChild className="flex h-14 items-center justify-start space-x-4 px-4" variant="outline">
      <Link href={connectUrl}>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            socialBackgroundColors[platform]
          } shadow-sm`}
        >
          <SocialIcon
            type={platform}
            size="md"
            className="text-white"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">
            {socialDisplayNames[platform]}
          </span>
          <span className="text-muted-foreground text-sm">
            {socialDescriptions[platform]}
          </span>
        </div>
      </Link>
    </Button>
  );
}

export function ConnectedAccountsHeader(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Connected Accounts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your social media connections and sync settings
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Social Account</DialogTitle>
              <DialogDescription>
                Choose a social media platform to connect with your account
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <ConnectPlatformButton key={platform} platform={platform} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
