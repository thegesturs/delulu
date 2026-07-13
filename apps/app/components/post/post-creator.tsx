"use client";

import { DottedSeparator } from "@delulu/design-system/components/ui/dotted-separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@delulu/design-system/components/ui/tabs";
import { cn } from "@delulu/design-system/lib/utils";
import { SocialTypes } from "@delulu/validators/post";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import type { EditorMediaDetail } from "@/lib/editor-media";
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
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();

  // Get single provider in default for smart labeling (memoized for performance)
  const singleProviderInDefault = useMemo(
    () => getSingleProviderInDefault(socialProviders, alternativeContent),
    [socialProviders, alternativeContent]
  );

  // Fetch post data if in edit mode
  const postData = useQuery({
    ...resources.posts.get(workspaceId ?? "", postId ?? ""),
    enabled: Boolean(workspaceId && postId),
  });
  const mediaIds = useMemo(
    () =>
      Array.from(
        new Set(
          (postData.data?.groups ?? []).flatMap((group) =>
            group.segments.flatMap((segment) =>
              segment.media.flatMap((media) => [
                media.id,
                ...(media.thumbnailMediaId ? [media.thumbnailMediaId] : []),
              ])
            )
          )
        )
      ),
    [postData.data]
  );
  const mediaResults = useQueries({
    queries: mediaIds.map((id) => ({
      ...resources.media.get(workspaceId ?? "", id),
      enabled: Boolean(workspaceId && postId),
    })),
    combine: (results) => ({
      data: results.flatMap((result) => (result.data ? [result.data] : [])),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
    }),
  });
  const mediaById = useMemo(
    () =>
      new Map(
        mediaResults.data.map((media) => [
          media.id,
          media satisfies EditorMediaDetail,
        ])
      ),
    [mediaResults.data]
  );

  // Load post data into store when fetched
  useEffect(() => {
    if (
      postData.data &&
      postId &&
      !(mediaResults.isPending || mediaResults.isError)
    ) {
      loadPost(postData.data, mediaById);
    }
  }, [
    postData.data,
    postId,
    loadPost,
    mediaById,
    mediaResults.isPending,
    mediaResults.isError,
  ]);

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
  if (postId && (postData.isPending || mediaResults.isPending)) {
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

  if (postId && (postData.isError || mediaResults.isError)) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header page="Unable to load post" pages={["Post"]} />
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">
              The post media could not be loaded. Please retry.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 pb-20 lg:flex-row lg:pb-0">
      <div className="flex-1">
        {/* Show warning if post is already published */}
        {postData.data?.status === "published" && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50/60 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
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
        {postData.data?.workspaceId && (
          <div className="mb-4">
            <ReviewBanner
              organizationId={postData.data.workspaceId}
              postId={postData.data.id}
              reviewStatus=""
            />
          </div>
        )}
        <div className="hidden lg:block">
          <Header
            page={postId ? "Edit Post" : "Create Post"}
            pages={["Post"]}
          />
          <DottedSeparator className="mb-4" />
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
          organizationId={postData.data?.workspaceId}
          postId={postId}
        />
      </div>
    </div>
  );
}
