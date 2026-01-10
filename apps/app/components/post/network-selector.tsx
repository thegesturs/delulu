'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';
import type { SocialType } from '@delulu/validators/post';

import { getPlatformsInDefault } from '@/lib/platform-rules';
import { useSelectedSocialProviders, useStore } from '@/store/post';
import { ArrowDown } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { SocialIcon } from './sidebar/social-icon';

export function AlternativeContentSelector() {
  const { post, setPost } = useStore(
    useShallow((state) => ({
      post: state.post,
      setPost: state.setPost,
    }))
  );
  const socialProviders = useSelectedSocialProviders();

  // Get platforms currently in default
  const platformsInDefault = getPlatformsInDefault(
    socialProviders,
    post.alternativeContent
  );

  // Check if a provider is the last one in default
  const isLastInDefault = (providerId: string) => {
    return (
      platformsInDefault.length === 1 &&
      socialProviders.find((p) => p.socialId === providerId) !== undefined &&
      !post.alternativeContent.some(
        (content) => content.socialProvider.socialId === providerId
      )
    );
  };

  const handleProviderToggle = (provider: {
    socialId: string;
    name: string;
    socialType: SocialType;
  }) => {
    const isSelected = post.alternativeContent.some(
      (content) => content.socialProvider.socialId === provider.socialId
    );

    // Prevent toggling if this is the last platform in default
    if (isLastInDefault(provider.socialId)) {
      return;
    }

    if (isSelected) {
      // Remove provider
      setPost({
        ...post,
        alternativeContent: post.alternativeContent.filter(
          (content) => content.socialProvider.socialId !== provider.socialId
        ),
      });
    } else {
      // Add provider with default content - deep copy ALL content items (supports threads)
      setPost({
        ...post,
        alternativeContent: [
          ...post.alternativeContent,
          {
            socialProvider: provider,
            content: post.content.map((contentItem, index) => ({
              id: '',
              order: index,
              name: provider.name,
              // Deep copy media to prevent reference sharing
              media: contentItem.media.map((m) => ({
                mediaType: m.mediaType,
                url: m.url,
                bucketKey: m.bucketKey,
                bucketUrl: m.bucketUrl,
                altText: m.altText,
                thumbnailBucketUrl: m.thumbnailBucketUrl,
                thumbnailBucketKey: m.thumbnailBucketKey,
              })),
              text: contentItem.text,
              title: contentItem.title, // Copy YouTube title
              tags: [...(contentItem.tags || [])], // Deep copy tags
              socialId: provider.socialId,
            })),
          },
        ],
      });
    }
  };

  if (!socialProviders.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="size-7 rounded-md">
          <ArrowDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {socialProviders.map((provider) => {
          const isSelected = post.alternativeContent.some(
            (content) => content.socialProvider.socialId === provider.socialId
          );
          const isDisabled = isLastInDefault(provider.socialId);

          const menuItem = (
            <DropdownMenuCheckboxItem
              key={provider.socialId}
              checked={isSelected}
              disabled={isDisabled}
              onCheckedChange={() => handleProviderToggle(provider)}
              className={isDisabled ? 'cursor-not-allowed opacity-50' : ''}
            >
              <div className="flex items-center gap-2">
                <SocialIcon type={provider.socialType} size="sm" />
                <span>{provider.name}</span>
              </div>
            </DropdownMenuCheckboxItem>
          );

          if (isDisabled) {
            return (
              <TooltipProvider key={provider.socialId}>
                <Tooltip>
                  <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
                  <TooltipContent>
                    Cannot create alternative content - this is the only
                    platform in default
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return menuItem;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
