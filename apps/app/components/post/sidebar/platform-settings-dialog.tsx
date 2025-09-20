'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import type { SocialType } from '@delulu/validators/post';
import { TikTokSettingsDisplay } from './tiktok-settings';

interface PlatformSettingsDialogProps {
  platform: SocialType;
  socialId: string;
  platformName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformSettingsDialog({
  platform,
  socialId,
  platformName,
  isOpen,
  onClose,
}: PlatformSettingsDialogProps) {
  const renderSettings = () => {
    switch (platform) {
      case 'TIKTOK':
        return <TikTokSettingsDisplay providerId={socialId} />;
      default:
        return (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No settings available for {platformName}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{platformName} Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{renderSettings()}</div>
      </DialogContent>
    </Dialog>
  );
}
