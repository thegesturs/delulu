'use client';

import { useCallback, useState } from 'react';

import { Card } from '@delulu/design-system/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';

import { useAlternativeContent } from '@/store/post';
import { ContentModule } from './content-module';
import { PostSidebar } from './sidebar/post-sidebar';

export function PostCreator() {
  const alternativeContent = useAlternativeContent();
  const [activeModuleId, setActiveModuleId] = useState<string>('global');

  const handleTabChange = useCallback(
    (value: string) => {
      if (value !== activeModuleId) {
        setActiveModuleId(value);
      }
    },
    [activeModuleId]
  );

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        <Card className="h-full p-4">
          <Tabs value={activeModuleId} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="global">Global</TabsTrigger>
              {/* {alternativeContent.map((content) => (
                <TabsTrigger
                  key={content.socialProvider.socialId}
                  value={content.socialProvider.socialId}
                >
                  {content.socialProvider.name}
                </TabsTrigger>
              ))} */}
            </TabsList>

            <TabsContent value="global">
              <ContentModule isGlobal />
            </TabsContent>

            {/* {alternativeContent.map((content) => (
              <TabsContent
                key={content.socialProvider.socialId}
                value={content.socialProvider.socialId}
              >
                <ContentModule
                  socialId={content.socialProvider.socialId}
                  socialType={content.socialProvider.socialType}
                />
              </TabsContent>
            ))} */}
          </Tabs>
        </Card>
      </div>
      <PostSidebar />
    </div>
  );
}
