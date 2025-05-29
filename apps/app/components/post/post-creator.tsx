'use client';

import { useState } from 'react';

import { Card } from '@delulu/design-system/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';

import { useStore } from '@/store/post';
import { ContentModule } from './content-module';
import { PostSidebar } from './post-sidebar';

export function PostCreator() {
  const { post } = useStore((state) => ({
    post: state.post,
  }));

  const [activeModuleId, setActiveModuleId] = useState<string>('global');

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        <Card className="h-full p-4">
          <Tabs value={activeModuleId} onValueChange={setActiveModuleId}>
            <TabsList>
              <TabsTrigger value="global">Global</TabsTrigger>
              {post.alternativeContent.map((content) => (
                <TabsTrigger
                  key={content.socialProvider.socialId}
                  value={content.socialProvider.socialId}
                >
                  {content.socialProvider.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="global">
              <ContentModule isGlobal />
            </TabsContent>

            {post.alternativeContent.map((content) => (
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
        </Card>
      </div>
      <PostSidebar />
    </div>
  );
}
