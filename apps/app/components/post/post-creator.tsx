'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';
import { useCallback, useEffect, useState } from 'react';

import {
  useAlternativeContent,
  useSelectedSocialProviders,
} from '@/store/post';
import { cn } from '@delulu/design-system/lib/utils';
import { SocialTypes } from '@delulu/validators/post';
import { ContentModule } from './content-module';
import { AlternativeContentSelector } from './network-selector';
import { PostSidebar } from './sidebar/post-sidebar';
import { SocialIcon } from './sidebar/social-icon';

export function PostCreator() {
  const alternativeContent = useAlternativeContent();
  const socialProviders = useSelectedSocialProviders();
  const [activeModuleId, setActiveModuleId] = useState<string>('global');

  const handleTabChange = useCallback(
    (value: string) => {
      if (value !== activeModuleId) {
        setActiveModuleId(value);
      }
    },
    [activeModuleId]
  );

  useEffect(() => {
    // If activeModuleId is not 'global' and not found in alternativeContent
    if (
      activeModuleId !== 'global' &&
      !alternativeContent.some(
        (content) => content.socialProvider.socialId === activeModuleId
      )
    ) {
      setActiveModuleId('global');
    }
  }, [alternativeContent, activeModuleId]);

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        <Tabs value={activeModuleId} onValueChange={handleTabChange}>
          <TabsList className={cn(socialProviders.length < 2 && 'hidden')}>
            <TabsTrigger value="global">Global</TabsTrigger>
            {alternativeContent.map((content) => (
              <TabsTrigger
                key={content.socialProvider.socialId}
                value={content.socialProvider.socialId}
                className="min-w-fit gap-2 text-xs"
              >
                <SocialIcon
                  type={content.socialProvider.socialType}
                  className="size-4"
                />
                {content.socialProvider.name}
              </TabsTrigger>
            ))}
            <AlternativeContentSelector />
          </TabsList>

          <TabsContent value="global">
            <ContentModule isGlobal socialType={SocialTypes.DEFAULT} />
          </TabsContent>

          {alternativeContent.map((content) => (
            <TabsContent
              key={content.socialProvider.socialId}
              value={content.socialProvider.socialId}
            >
              <ContentModule
                socialId={content.socialProvider.socialId}
                socialType={content.socialProvider.socialType}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <PostSidebar />
    </div>
  );
}
