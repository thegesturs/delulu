'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@delulu/design-system/components/ui/dialog';
import type { SocialTypes } from '@delulu/validators/post';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaTiktok,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiFarcaster, SiThreads } from 'react-icons/si';
import { FarcasterConnect } from './farcaster-connect';

interface ConnectedAccountsHeaderProps {
  onConnect: (platform: keyof typeof SocialTypes) => void;
}

export function ConnectedAccountsHeader({
  onConnect,
}: ConnectedAccountsHeaderProps) {
  const [showFarcasterConnect, setShowFarcasterConnect] = useState(false);

  const handleFarcasterConnect = () => {
    setShowFarcasterConnect(true);
  };

  const handleFarcasterSuccess = () => {
    // Refresh the page or refetch connected accounts
    window.location.reload();
  };

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
              <Button
                onClick={() => onConnect('TWITTER')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <FaXTwitter className="h-6 w-6 text-card-foreground" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">X (Twitter)</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your X account
                  </span>
                </div>
              </Button>
              <Button
                onClick={() => onConnect('LINKEDIN')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <FaLinkedin className="h-6 w-6 text-sky-700" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">LinkedIn</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your LinkedIn profile
                  </span>
                </div>
              </Button>
              <Button
                onClick={() => onConnect('TIKTOK')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <FaTiktok className="h-6 w-6 text-card-foreground" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">TikTok</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your TikTok profile
                  </span>
                </div>
              </Button>
              <Button
                onClick={() => onConnect('INSTAGRAM')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <FaInstagram className="h-6 w-6 text-card-foreground" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Instagram</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your Instagram profile
                  </span>
                </div>
              </Button>
              <Button
                onClick={() => onConnect('THREADS')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <SiThreads className="h-6 w-6 text-card-foreground" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Threads</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your Threads profile
                  </span>
                </div>
              </Button>
              <Button
                onClick={() => onConnect('FACEBOOK')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <FaFacebook className="h-6 w-6 text-blue-600" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Facebook</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your Facebook page
                  </span>
                </div>
              </Button>
              <Button
                onClick={() => onConnect('PINTEREST')}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <FaPinterest className="h-6 w-6 text-red-600" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Pinterest</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your Pinterest account
                  </span>
                </div>
              </Button>
              <Button
                onClick={handleFarcasterConnect}
                className="flex h-14 items-center justify-start space-x-4 px-4"
                variant="outline"
              >
                <SiFarcaster className="h-6 w-6 text-purple-600" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Farcaster</span>
                  <span className="text-muted-foreground text-sm">
                    Connect your Farcaster account
                  </span>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <FarcasterConnect
        isOpen={showFarcasterConnect}
        onClose={() => setShowFarcasterConnect(false)}
        onSuccess={handleFarcasterSuccess}
      />
    </div>
  );
}
