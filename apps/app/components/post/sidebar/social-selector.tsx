'use client';

import {
  postActions,
  useSelectedSocialProviders,
  useStore,
} from '@/store/post';
import { api } from '@/trpc/react';
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
import type { SocialType } from '@delulu/validators/post';
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from 'motion/react';
import { useState } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { SocialIcon } from './social-icon';

interface SocialSelectorItemProps {
  socialProvider: SocialType;
  name: string;
  socialId: string;
}

// const mockSocialProviders = [
//   {
//     id: '1',
//     fullName: 'I am Cool',
//     username: 'I am Cool',
//     socialType: SocialTypes.TWITTER,
//     socialId: 'twitter',
//   },
//   {
//     id: '2',
//     fullName: 'I am Cool',
//     username: 'I am Cool',
//     socialType: SocialTypes.INSTAGRAM,
//     socialId: 'instagram',
//   },
//   {
//     id: '3',
//     fullName: 'I am Cool',
//     username: 'I am Cool',
//     socialType: SocialTypes.LINKEDIN,
//     socialId: 'linkedin',
//   },
//   {
//     id: '4',
//     fullName: 'I am Cool',
//     username: 'I am Cool',
//     socialType: SocialTypes.YOUTUBE,
//     socialId: 'youtube',
//   },
// ];

export default function SocialSelector() {
  const { data: socialProviders } =
    api.socialProvider.getConnectedAccounts.useQuery();

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
        <motion.div className="grid grid-cols-2 gap-1">
          <LayoutGroup>
            <AnimatePresence initial={false} mode="popLayout">
              {socialProviders?.map((account) => (
                <SocialSelectorItem
                  key={account.id}
                  socialProvider={account.socialType}
                  name={account.fullName ?? account.username}
                  socialId={account.id}
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </MotionConfig>
    </div>
  );
}

function SocialSelectorItem({
  socialProvider,
  name,
  socialId,
}: SocialSelectorItemProps) {
  const selectedSocialProviders = useSelectedSocialProviders();
  const post = useStore((state) => state.post);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      postActions.addSocialProvider({
        socialId,
        name,
        socialType: socialProvider,
      });
    }
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
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1"
                >
                  <IoCheckmarkCircle className="h-4 w-4" />
                </motion.span>
              )}
            </motion.div>
          </Badge>
        </motion.div>
      </motion.div>
    </>
  );
}
