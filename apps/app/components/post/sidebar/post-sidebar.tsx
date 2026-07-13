"use client";

import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@delulu/design-system/components/ui/animated-tabs";
import { CardContent } from "@delulu/design-system/components/ui/card";
import { DottedSeparator } from "@delulu/design-system/components/ui/dotted-separator";
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
  socialIcons,
} from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import { useState } from "react";
import { ReviewActivity } from "@/components/posts/review-activity";
import { useSelectedSocialProviders } from "@/store/post";
import { BasicSettings } from "./basic-settings";
import { PlatformPreview } from "./previews";

interface PostSidebarProps {
  postId?: string;
  organizationId?: string;
}

export function PostSidebar({ postId, organizationId }: PostSidebarProps) {
  const socialProviders = useSelectedSocialProviders();
  const [activePreviewPlatform, setActivePreviewPlatform] =
    useState<SupportedSocialPlatform | null>(null);

  const hasProviders = socialProviders.length > 0;
  const showActivity = !!postId && !!organizationId;

  // Default to first selected provider if none active
  const currentPlatform =
    activePreviewPlatform &&
    socialProviders.some((p) => p.socialType === activePreviewPlatform)
      ? activePreviewPlatform
      : ((socialProviders[0]?.socialType as
          | SupportedSocialPlatform
          | undefined) ?? null);

  const tabClass =
    "rounded-none border-0 border-transparent border-b-2 bg-transparent px-0 py-2 font-medium text-muted-foreground text-sm data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current";

  return (
    <div className="flex h-full w-full flex-col bg-card lg:w-[420px] lg:border-border/60 lg:border-l">
      <Tabs
        className="flex min-h-0 w-full flex-1 flex-col"
        defaultValue="basic"
      >
        <TabsList
          className={cn(
            "grid w-full shrink-0 rounded-none bg-transparent px-3 pt-1",
            showActivity ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          <TabsTrigger className={tabClass} value="basic">
            Basic
          </TabsTrigger>
          <TabsTrigger
            className={tabClass}
            disabled={!hasProviders}
            value="preview"
          >
            Preview
          </TabsTrigger>
          {showActivity && (
            <TabsTrigger className={tabClass} value="activity">
              Activity
            </TabsTrigger>
          )}
        </TabsList>
        <DottedSeparator className="-mt-px shrink-0" />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent className="mt-0 space-y-0" value="basic">
            <BasicSettings />
          </TabsContent>

          <TabsContent className="mt-0 space-y-0" value="preview">
            {hasProviders && currentPlatform && (
              <>
                {/* Platform selector pills */}
                {socialProviders.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                    {socialProviders.map((provider) => {
                      const platform =
                        provider.socialType as SupportedSocialPlatform;
                      const IconComponent = socialIcons[platform];
                      const isActive = platform === currentPlatform;
                      return (
                        <button
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-colors",
                            isActive
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          )}
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

          {showActivity && (
            <TabsContent className="mt-0" value="activity">
              <CardContent className="px-1 pt-4">
                <ReviewActivity postId={postId} />
              </CardContent>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
