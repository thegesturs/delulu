"use client";

import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@delulu/design-system/components/ui/animated-tabs";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
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
    <Card className="w-full lg:w-[500px]">
      <Tabs className="w-full px-3" defaultValue="basic">
        <TabsList
          className={cn(
            "grid w-full rounded-none border-b bg-transparent p-0",
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
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-accent"
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
              <ReviewActivity postId={postId as Id<"posts">} />
            </CardContent>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}
