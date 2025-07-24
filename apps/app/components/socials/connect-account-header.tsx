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
import { useState } from 'react';

interface ConnectedAccountsHeaderProps {
  onConnect: (platform: SocialType) => void;
}

const SOCIAL_PLATFORMS: SupportedSocialPlatform[] = [
  'TWITTER',
  'LINKEDIN',
  'TIKTOK',
  'INSTAGRAM',
  'THREADS',
  'FACEBOOK',
  'PINTEREST',
  'FARCASTER',
];

export function ConnectedAccountsHeader({
  onConnect,
}: ConnectedAccountsHeaderProps) {
  const [showFarcasterConnect, setShowFarcasterConnect] = useState(false);

  const handleFarcasterConnect = () => {
    setShowFarcasterConnect(true);
  };

  // const handleFarcasterSuccess = () => {
  //   // Refresh the page or refetch connected accounts
  //   window.location.reload();
  // };

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
                <Button
                  key={platform}
                  onClick={() =>
                    platform === 'FARCASTER'
                      ? handleFarcasterConnect()
                      : onConnect(platform)
                  }
                  className="flex h-14 items-center justify-start space-x-4 px-4"
                  variant="outline"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    socialBackgroundColors[platform]
                  } shadow-sm`}>
                    <SocialIcon type={platform} size="md" className="text-white" />
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
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* <FarcasterConnect
        isOpen={showFarcasterConnect}
        onClose={() => setShowFarcasterConnect(false)}
        onSuccess={handleFarcasterSuccess}
      /> */}
    </div>
  );
}
