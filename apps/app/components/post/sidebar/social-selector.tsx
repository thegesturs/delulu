'use client';

import {
  postActions,
  useSelectedSocialProviders,
  useStore,
} from '@/store/post';
import { api as trpcApi } from '@/trpc/react';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@delulu/design-system/components/ui/alert-dialog';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { DEFAULT_TIKTOK_SETTINGS } from '@delulu/validators/constants/settings';
import type { SocialType } from '@delulu/validators/post';
import { useQuery } from 'convex-helpers/react/cache';
import { Icon } from '@delulu/design-system/providers/icon';
import { Settings01Icon } from '@hugeicons-pro/core-solid-rounded';
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from 'motion/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { toast } from 'sonner';
import { PlatformSettingsDialog } from './platform-settings-dialog';
import { SocialIcon } from './social-icon';

interface SocialSelectorItemProps {
  socialProvider: SocialType;
  name: string;
  socialId: string;
}

export default function SocialSelector() {
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);
  const selectedProviders = useSelectedSocialProviders();

  // Validate that selected providers still exist in the database
  const validatedSelectedProviders = useMemo(() => {
    if (!socialProviders) return selectedProviders;

    const validIds = new Set(socialProviders.map((p) => p._id));
    const valid = selectedProviders.filter((p) =>
      validIds.has(p.socialId as Id<'socialProviders'>)
    );

    // Clean up if mismatch detected
    if (valid.length !== selectedProviders.length) {
      // Use the cleanup helper from the store
      const validProviderIds = Array.from(validIds);
      useStore.getState().cleanupDeletedProviders(validProviderIds);
    }

    return valid;
  }, [socialProviders, selectedProviders]);

  // Show warning if providers were removed
  useEffect(() => {
    if (!socialProviders) return;

    const removed =
      selectedProviders.length - validatedSelectedProviders.length;
    if (removed > 0) {
      toast.error(
        `${removed} social account${removed > 1 ? 's were' : ' was'} disconnected and removed from this post.`
      );
    }
  }, [
    socialProviders,
    selectedProviders.length,
    validatedSelectedProviders.length,
  ]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">Select Social Networks</h3>
      <MotionConfig
        transition={{
          duration: 0.4,
          type: 'spring',
          bounce: 0.2,
        }}
      >
        <motion.div className="grid grid-cols-1 gap-1 md:grid-cols-2">
          <LayoutGroup>
            <AnimatePresence initial={false} mode="popLayout">
              {socialProviders?.map((account) => (
                <SocialSelectorItem
                  key={account._id}
                  socialProvider={account.socialType}
                  name={account.fullName ?? account.username}
                  socialId={account._id}
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </MotionConfig>
    </div>
  );
}

// Helper function to determine which platforms have settings
function hasSettings(platform: SocialType): boolean {
  return platform === 'TIKTOK';
}

function SocialSelectorItem({
  socialProvider,
  name,
  socialId,
}: SocialSelectorItemProps) {
  const selectedSocialProviders = useSelectedSocialProviders();
  const post = useStore((state) => state.post);
  const setProviderSettings = useStore((state) => state.setProviderSettings);
  const getProviderSettings = useStore((state) => state.getProviderSettings);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Prefetch TikTok creator info
  const utils = trpcApi.useUtils();

  const isSelected = selectedSocialProviders?.some(
    (account) => account.socialId === socialId
  );

  const hasAlternativeContent = post.alternativeContent.some(
    (content) => content.socialProvider.socialId === socialId
  );

  const handleSelect = () => {
    if (isSelected) {
      if (hasAlternativeContent) {
        setShowDeleteDialog(true);
      } else {
        postActions.removeSocialProvider(socialId);
      }
    } else {
      // Prefetch TikTok creator info when selected
      if (socialProvider === 'TIKTOK') {
        utils.socialProvider.getTikTokCreatorInfo.prefetch({
          socialProviderId: socialId,
        });
      }

      postActions.addSocialProvider({
        socialId,
        name,
        socialType: socialProvider,
      });

      // Auto-initialize default settings for platforms that require them
      if (socialProvider === 'TIKTOK') {
        // Only set defaults if no settings exist for this provider
        const existingSettings = getProviderSettings(socialId);
        if (!existingSettings) {
          setProviderSettings(socialId, {
            socialProviderId: socialId,
            type: 'TIKTOK',
            settings: DEFAULT_TIKTOK_SETTINGS,
          });
        }
      }
      // Add more platforms here as needed
    }
  };

  const handleSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent badge click
    setShowSettingsDialog(true);
  };

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Social Network</AlertDialogTitle>
            <AlertDialogDescription>
              This social network has custom content. Removing it will delete
              all associated custom content. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                postActions.removeSocialProvider(socialId);
                setShowDeleteDialog(false);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div layout>
          <Badge
            size="lg"
            variant={isSelected ? 'blue' : 'outline'}
            onClick={handleSelect}
            className="w-full cursor-pointer text-xs transition-colors duration-200"
          >
            <motion.div layout className="flex w-full items-center gap-2">
              <SocialIcon type={socialProvider} />
              <motion.span layout className="flex-1 text-left">
                {name}
              </motion.span>
              <div className="flex items-center gap-1">
                {isSelected && hasSettings(socialProvider) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSettingsClick}
                    className="h-6 w-6 hover:bg-white/20"
                  >
                    <Icon icon={Settings01Icon} size={12} />
                  </Button>
                )}
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-1"
                  >
                    <IoCheckmarkCircle className="h-4 w-4" />
                  </motion.span>
                )}
              </div>
            </motion.div>
          </Badge>
        </motion.div>
      </motion.div>

      <PlatformSettingsDialog
        platform={socialProvider}
        socialId={socialId}
        platformName={name}
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </>
  );
}
