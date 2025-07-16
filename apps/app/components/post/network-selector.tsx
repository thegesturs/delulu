'use client';

import { useMemo } from 'react';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import type { SocialType } from '@delulu/validators/post';

import { useStore } from '@/store/post';
import { ArrowDown } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { SocialIcon } from './sidebar/social-icon';

export function AlternativeContentSelector() {
  const { post, socialProviders, setPost } = useStore(
    useShallow((state) => ({
      post: state.post,
      socialProviders: state.selectedSocialProviders,
      setPost: state.setPost,
    }))
  );

  // Calculate providers without alternative content
  // const availableProviders = useMemo(() => {
  //   return socialProviders.filter(
  //     (provider) =>
  //       !post.alternativeContent.some(
  //         (content) => content.socialProvider.socialId === provider.socialId
  //       )
  //   );
  // }, [socialProviders, post.alternativeContent]);

  const handleProviderToggle = (provider: {
    socialId: string;
    name: string;
    socialType: SocialType;
  }) => {
    const isSelected = post.alternativeContent.some(
      (content) => content.socialProvider.socialId === provider.socialId
    );

    if (isSelected) {
      // Remove provider
      setPost({
        ...post,
        alternativeContent: post.alternativeContent.filter(
          (content) => content.socialProvider.socialId !== provider.socialId
        ),
      });
    } else {
      // Add provider with default content
      setPost({
        ...post,
        alternativeContent: [
          ...post.alternativeContent,
          {
            socialProvider: provider,
            content: [
              {
                id: '',
                order: 0,
                name: provider.name,
                media: post.content[0]?.media || [],
                text: post.content[0]?.text || '',
                tags: [],
                socialId: provider.socialId,
              },
            ],
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

          return (
            <DropdownMenuCheckboxItem
              key={provider.socialId}
              checked={isSelected}
              onCheckedChange={() => handleProviderToggle(provider)}
            >
              <div className="flex items-center gap-2">
                <SocialIcon type={provider.socialType} size="sm" />
                <span>{provider.name}</span>
              </div>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
