'use client';

import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';
import { useQuery } from 'convex-helpers/react/cache';
import { useCallback, useEffect, useState } from 'react';

import { getSingleProviderInDefault } from '@/lib/platform-rules';
import {
  useAlternativeContent,
  useSelectedSocialProviders,
  useStore,
} from '@/store/post';
import { cn } from '@delulu/design-system/lib/utils';
import { SocialTypes } from '@delulu/validators/post';
import { Header } from '../layout/header';
import { ContentModule } from './content-module';
import { AlternativeContentSelector } from './network-selector';
import { PostSidebar } from './sidebar/post-sidebar';
import { SocialIcon } from './sidebar/social-icon';

interface PostCreatorProps {
  postId?: string;
}

export function PostCreator({ postId }: PostCreatorProps = {}) {
  const alternativeContent = useAlternativeContent();
  const socialProviders = useSelectedSocialProviders();
  const [activeModuleId, setActiveModuleId] = useState<string>('global');
  const loadPost = useStore((state) => state.loadPost);
  const post = useStore((state) => state.post);

  // Get single provider in default for smart labeling
  const singleProviderInDefault = getSingleProviderInDefault(
    socialProviders,
    alternativeContent
  );

  // Fetch post data if in edit mode
  const postData = useQuery(
    api.posts.getPostById,
    postId ? { id: postId as Id<'posts'> } : 'skip'
  );

  // Load post data into store when fetched
  useEffect(() => {
    if (postData && postId) {
      loadPost(postData);
    }
  }, [postData, postId, loadPost]);

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

  // Show loading state while fetching post data
  if (postId && !postData) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header pages={['Post']} page="Loading..." />
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading post...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        {/* Show warning if post is already published */}
        {postData && postData.status === 'PUBLISHED' && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-800">
            <h3 className="font-semibold">
              Warning: This post has already been published
            </h3>
            <p className="text-sm">
              This post has already been published to social media. Any changes
              you make will only be saved as drafts and won't affect the
              published content.
            </p>
          </div>
        )}
        <Header pages={['Post']} page={postId ? 'Edit Post' : 'Create Post'} />
        <Tabs value={activeModuleId} onValueChange={handleTabChange}>
          <TabsList className={cn(socialProviders.length < 2 && 'hidden')}>
            <TabsTrigger value="global" className={cn(singleProviderInDefault && 'min-w-fit gap-2 text-xs')}>
              {singleProviderInDefault ? (
                <>
                  <SocialIcon
                    type={singleProviderInDefault.socialType}
                    className="size-4"
                  />
                  {singleProviderInDefault.name}
                </>
              ) : (
                'Global'
              )}
            </TabsTrigger>
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
            <ContentModule socialId="global" socialType={SocialTypes.DEFAULT} />
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
