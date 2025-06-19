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
import { FaInstagram, FaLinkedin, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface ConnectedAccountsHeaderProps {
  onConnect: (platform: keyof typeof SocialTypes) => void;
}

export function ConnectedAccountsHeader({
  onConnect,
}: ConnectedAccountsHeaderProps) {
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
