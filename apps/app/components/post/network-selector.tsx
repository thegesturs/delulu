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
  // import { SocialIcon } from '../common/SocialIcon';

export function NetworkSelector() {
  const { post, socialProviders, setPost } = useStore((state) => ({
    post: state.post,
    socialProviders: state.socialProviders,
    setPost: state.setPost,
  }));

  // Calculate providers without alternative content
  const availableProviders = useMemo(() => {
    return socialProviders.filter(
      (provider) =>
        !post.alternativeContent.some(
          (content) => content.socialProvider.socialId === provider.socialId
        )
    );
  }, [socialProviders, post.alternativeContent]);

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
                media: [],
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
    <div className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            Select Networks
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
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
                  {/* <SocialIcon type={provider.socialType} size="sm" /> */}
                  <span>{provider.name}</span>
                </div>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
