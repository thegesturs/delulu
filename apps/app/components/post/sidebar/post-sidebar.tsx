'use client';

import { useSelectedSocialProviders } from '@/store/post';
import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from '@delulu/design-system/components/ui/animated-tabs';
import { Card } from '@delulu/design-system/components/ui/card';
import { BasicSettings } from './basic-settings';
import { TikTokPreview } from './tiktok-preview';

export function PostSidebar() {
  const socialProviders = useSelectedSocialProviders();

  // Check if TikTok is selected
  const hasTikTokSelected = socialProviders.some(
    (provider) => provider.socialType === 'TIKTOK'
  );

  return (
    <Card className="w-full lg:w-[500px]">
      <Tabs defaultValue="basic" className="w-full px-3">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="basic"
            className="rounded-none border-0 border-transparent border-b-2 bg-transparent px-0 py-2 font-medium text-muted-foreground text-sm data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current"
          >
            Basic
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            disabled={!hasTikTokSelected}
            className="rounded-none border-0 border-transparent border-b-2 bg-transparent px-0 py-2 font-medium text-muted-foreground text-sm data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current"
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-0 space-y-0">
          <BasicSettings />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 space-y-0">
          {hasTikTokSelected && <TikTokPreview />}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
