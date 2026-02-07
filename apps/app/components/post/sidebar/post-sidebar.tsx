"use client";

import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@delulu/design-system/components/ui/animated-tabs";
import { Card } from "@delulu/design-system/components/ui/card";
import { useSelectedSocialProviders } from "@/store/post";
import { BasicSettings } from "./basic-settings";
import { TikTokPreview } from "./tiktok-preview";

export function PostSidebar() {
  const socialProviders = useSelectedSocialProviders();

  // Check if TikTok is selected
  const hasTikTokSelected = socialProviders.some(
    (provider) => provider.socialType === "TIKTOK"
  );

  return (
    <Card className="w-full lg:w-[500px]">
      <Tabs className="w-full px-3" defaultValue="basic">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            className="rounded-none border-0 border-transparent border-b-2 bg-transparent px-0 py-2 font-medium text-muted-foreground text-sm data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current"
            value="basic"
          >
            Basic
          </TabsTrigger>
          <TabsTrigger
            className="rounded-none border-0 border-transparent border-b-2 bg-transparent px-0 py-2 font-medium text-muted-foreground text-sm data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current"
            disabled={!hasTikTokSelected}
            value="preview"
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0 space-y-0" value="basic">
          <BasicSettings />
        </TabsContent>

        <TabsContent className="mt-0 space-y-0" value="preview">
          {hasTikTokSelected && <TikTokPreview />}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
