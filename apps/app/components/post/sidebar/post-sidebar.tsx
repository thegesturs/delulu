"use client";

import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@delulu/design-system/components/ui/animated-tabs";
import { Card } from "@delulu/design-system/components/ui/card";
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
  socialIcons,
} from "@delulu/design-system/lib/social-config";
import { useState } from "react";
import { useSelectedSocialProviders } from "@/store/post";
import { BasicSettings } from "./basic-settings";
import { PlatformPreview } from "./previews";

export function PostSidebar() {
  const socialProviders = useSelectedSocialProviders();
  const [activePreviewPlatform, setActivePreviewPlatform] =
    useState<SupportedSocialPlatform | null>(null);

  const hasProviders = socialProviders.length > 0;

  // Default to first selected provider if none active
  const currentPlatform =
    activePreviewPlatform &&
    socialProviders.some((p) => p.socialType === activePreviewPlatform)
      ? activePreviewPlatform
      : ((socialProviders[0]?.socialType as
          | SupportedSocialPlatform
          | undefined) ?? null);

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
            disabled={!hasProviders}
            value="preview"
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0 space-y-0" value="basic">
          <BasicSettings />
        </TabsContent>

        <TabsContent className="mt-0 space-y-0" value="preview">
          {hasProviders && currentPlatform && (
            <>
              {/* Platform selector pills */}
              {socialProviders.length > 1 && (
                <div className="flex flex-wrap gap-2 px-2 pt-3">
                  {socialProviders.map((provider) => {
                    const platform =
                      provider.socialType as SupportedSocialPlatform;
                    const IconComponent = socialIcons[platform];
                    const isActive = platform === currentPlatform;
                    return (
                      <button
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-colors ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-accent"
                        }`}
                        key={provider.socialId}
                        onClick={() => setActivePreviewPlatform(platform)}
                        type="button"
                      >
                        {IconComponent && (
                          <IconComponent className="h-3.5 w-3.5" />
                        )}
                        {socialDisplayNames[platform] || platform}
                      </button>
                    );
                  })}
                </div>
              )}
              <PlatformPreview socialType={currentPlatform} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
