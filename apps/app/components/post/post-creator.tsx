"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@delulu/design-system/components/ui/tabs";
import { cn } from "@delulu/design-system/lib/utils";
import { SocialTypes } from "@delulu/validators/post";
import { useQuery } from "convex-helpers/react/cache";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NodePositions } from "@/components/automations/flow-builder/hooks/use-automation-state";
import { getSingleProviderInDefault } from "@/lib/platform-rules";
import {
  useAlternativeContent,
  useSelectedSocialProviders,
  useStore,
} from "@/store/post";
import { Header } from "../layout/header";
import { ContentModule } from "./content-module";
import { MobilePostHeader } from "./mobile-post-header";
import { AlternativeContentSelector } from "./network-selector";
import { ReviewBanner } from "./review-banner";
import { PostSidebar } from "./sidebar/post-sidebar";
import { SocialIcon } from "./sidebar/social-icon";

interface PostCreatorProps {
  postId?: string;
}

export function PostCreator({ postId }: PostCreatorProps = {}) {
  const searchParams = useSearchParams();
  const alternativeContent = useAlternativeContent();
  const socialProviders = useSelectedSocialProviders();
  const [activeModuleId, setActiveModuleId] = useState<string>("global");
  const loadPost = useStore((state) => state.loadPost);
  const _post = useStore((state) => state.post);
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime);
  const setTime = useStore((state) => state.setTime);

  // Get single provider in default for smart labeling (memoized for performance)
  const singleProviderInDefault = useMemo(
    () => getSingleProviderInDefault(socialProviders, alternativeContent),
    [socialProviders, alternativeContent]
  );

  // Fetch post data if in edit mode
  const postData = useQuery(
    api.posts.getPostById,
    postId ? { id: postId as Id<"posts"> } : "skip"
  );

  // Load post data into store when fetched
  useEffect(() => {
    if (postData && postId) {
      loadPost(postData);
    }
  }, [postData, postId, loadPost]);

  // Handle scheduledAt query parameter from calendar
  useEffect(() => {
    // Only handle scheduledAt if not in edit mode
    if (!postId) {
      const scheduledAtParam = searchParams.get("scheduledAt");
      if (scheduledAtParam) {
        const scheduledTime = Number.parseInt(scheduledAtParam, 10);
        if (!Number.isNaN(scheduledTime)) {
          const scheduledDate = new Date(scheduledTime);
          // Set the date in the store
          setDateAlongWithTime(scheduledDate);
          // Set the time in HH:mm format
          setTime(format(scheduledDate, "HH:mm"));
        }
      }
    }
  }, [postId, searchParams, setDateAlongWithTime, setTime]);

  // Clear stale automation configs for new posts
  useEffect(() => {
    if (!postId) {
      useStore.setState({ automationConfigs: {} });
    }
  }, [postId]);

  // Preload automation configs for edit mode so indicators show immediately
  const allAutomations = useQuery(
    api.automations.getAutomations,
    postId ? {} : "skip"
  );
  const hasPreloaded = useRef(false);
  const setAutomationConfig = useStore((state) => state.setAutomationConfig);

  useEffect(() => {
    if (hasPreloaded.current || !postId || !allAutomations || !postData) {
      return;
    }

    const instagramProviders = postData.socialProviders.filter(
      (p) => p.socialType === "INSTAGRAM"
    );

    for (const provider of instagramProviders) {
      // Skip if config already loaded (e.g. from instagram-settings)
      if (useStore.getState().automationConfigs[provider._id]) {
        continue;
      }

      const linked = allAutomations.find(
        (a) =>
          a.socialProviderId === provider._id &&
          a.triggers.some((t) => t.pendingPostIds?.includes(postId))
      );

      if (linked) {
        setAutomationConfig(provider._id, {
          templateSlug: "",
          socialProviderId: provider._id,
          name: linked.name,
          triggers: linked.triggers,
          steps: linked.steps,
          notes: linked.notes ?? [],
          nodePositions: (linked.nodePositions as NodePositions) ?? {},
          isActive: linked.isActive,
          existingAutomationId: linked._id,
        });
      }
    }

    hasPreloaded.current = true;
  }, [postId, allAutomations, postData, setAutomationConfig]);

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
      activeModuleId !== "global" &&
      !alternativeContent.some(
        (content) => content.socialProvider.socialId === activeModuleId
      )
    ) {
      setActiveModuleId("global");
    }
  }, [alternativeContent, activeModuleId]);

  // Show loading state while fetching post data
  if (postId && !postData) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header page="Loading..." pages={["Post"]} />
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading post...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 pb-20 lg:flex-row lg:pb-0">
      <div className="flex-1">
        {/* Show warning if post is already published */}
        {postData && postData.status === "PUBLISHED" && (
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

        {/* Review status banner for org posts */}
        {postData?.organizationId && (
          <div className="mb-4">
            <ReviewBanner
              organizationId={postData.organizationId}
              postId={postData._id}
              reviewStatus={postData.reviewStatus}
            />
          </div>
        )}
        <div className="hidden lg:block">
          <Header
            page={postId ? "Edit Post" : "Create Post"}
            pages={["Post"]}
          />
        </div>
        <MobilePostHeader />

        <Tabs onValueChange={handleTabChange} value={activeModuleId}>
          <div className="w-full overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
            <TabsList
              className={cn(
                socialProviders.length < 2 && "hidden",
                "w-max justify-start lg:w-full"
              )}
            >
              <TabsTrigger
                className={cn(
                  singleProviderInDefault && "min-w-fit gap-2 text-xs"
                )}
                value="global"
              >
                {singleProviderInDefault ? (
                  <>
                    <SocialIcon
                      className="size-4"
                      type={singleProviderInDefault.socialType}
                    />
                    {singleProviderInDefault.name}
                  </>
                ) : (
                  "Global"
                )}
              </TabsTrigger>
              {alternativeContent.map((content) => (
                <TabsTrigger
                  className="min-w-fit gap-2 text-xs"
                  key={content.socialProvider.socialId}
                  value={content.socialProvider.socialId}
                >
                  <SocialIcon
                    className="size-4"
                    type={content.socialProvider.socialType}
                  />
                  {content.socialProvider.name}
                </TabsTrigger>
              ))}
              <AlternativeContentSelector />
            </TabsList>
          </div>

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
      <div className="hidden lg:block">
        <PostSidebar
          organizationId={postData?.organizationId}
          postId={postId}
        />
      </div>
    </div>
  );
}
