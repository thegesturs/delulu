"use client";

import { resourceEffect } from "@delulu/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@delulu/design-system/components/ui/tabs";
import { cn } from "@delulu/design-system/lib/utils";
import { SocialTypes } from "@delulu/validators/post";
import { format } from "date-fns";
import { Effect } from "effect";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import type { EditorMediaDetail } from "@/lib/editor-media";
import { getSingleProviderInDefault } from "@/lib/platform-rules";
import { useResourceAtom } from "@/state/resources";
import {
  postEditorCommands,
  useAlternativeContent,
  useSelectedSocialProviders,
  useStore,
} from "@/store/post";
import { ComposerToolbar } from "./composer-toolbar";
import { ContentModule } from "./content-module";
import { AlternativeContentSelector } from "./network-selector";
import { ReviewBanner } from "./review-banner";
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
  const setDateAlongWithTime = useStore((state) => state.setDateAlongWithTime);
  const setTime = useStore((state) => state.setTime);
  const appliedDraftRef = useRef<string | null>(null);
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();

  // Get single provider in default for smart labeling (memoized for performance)
  const singleProviderInDefault = useMemo(
    () => getSingleProviderInDefault(socialProviders, alternativeContent),
    [socialProviders, alternativeContent]
  );

  // Fetch post data if in edit mode
  const postData = useResourceAtom({
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
  const mediaOptions = useMemo(
    () =>
      resourceEffect({
        queryKey: ["workspace", workspaceId, "media", "details", mediaIds],
        effect: () =>
          Effect.all(
            mediaIds.map((id) =>
              resources.media.get(workspaceId ?? "", id).effect()
            ),
            { concurrency: "unbounded" }
          ),
      }),
    [mediaIds, resources, workspaceId]
  );
  const mediaResults = useResourceAtom({
    ...mediaOptions,
    enabled: Boolean(workspaceId && postId && mediaIds.length > 0),
  });
  const mediaById = useMemo(
    () =>
      new Map(
        (mediaResults.data ?? []).map((media) => [
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

  // Start a clean, editable post from a public tool handoff.
  useEffect(() => {
    if (postId) {
      return;
    }

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const fragmentText =
      fragment.get("source") === "social-preview-tool"
        ? fragment.get("text")?.trim().slice(0, 5000)
        : undefined;
    const draft =
      fragmentText ??
      searchParams.get("draft")?.trim().slice(0, 5000) ??
      searchParams.get("text")?.trim().slice(0, 5000);
    if (!draft || appliedDraftRef.current === draft) {
      return;
    }

    appliedDraftRef.current = draft;
    postEditorCommands.applyDraftHandoff(draft);
    if (fragmentText) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, [postId, searchParams]);

  // Handle scheduledAt query parameter from calendar after any text handoff
  // has cleared a previous draft.
  useEffect(() => {
    if (!postId) {
      const scheduledAtParam = searchParams.get("scheduledAt");
      if (scheduledAtParam) {
        const scheduledTime = Number.parseInt(scheduledAtParam, 10);
        if (!Number.isNaN(scheduledTime)) {
          const scheduledDate = new Date(scheduledTime);
          setDateAlongWithTime(scheduledDate);
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
      <div className="flex h-full flex-col">
        <ComposerToolbar actionsDisabled postId={postId} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading post…</div>
        </div>
      </div>
    );
  }

  if (postId && (postData.isError || mediaResults.isError)) {
    return (
      <div className="flex h-full flex-col">
        <ComposerToolbar actionsDisabled postId={postId} />
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <h2 className="font-medium">Unable to load post</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              The post media could not be loaded. Please retry.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <ComposerToolbar
        organizationId={postData.data?.workspaceId}
        postId={postId}
      />

      <Tabs
        className="flex min-h-0 flex-1 flex-col"
        onValueChange={handleTabChange}
        value={activeModuleId}
      >
        <div className="shrink-0 border-border/60 border-b bg-background">
          <div className="mx-auto w-full max-w-5xl overflow-x-auto px-3 py-2 sm:px-6">
            <TabsList
              className={cn(
                socialProviders.length < 2 && "hidden",
                "h-11 w-max justify-start gap-1 bg-transparent p-0"
              )}
            >
              <TabsTrigger
                className={cn(
                  "h-11 min-w-fit rounded-lg px-3 text-sm",
                  singleProviderInDefault && "gap-2"
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
                  className="h-11 min-w-fit gap-2 rounded-lg px-3 text-sm"
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
            {postData.data?.status === "published" && (
              <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-800">
                <h3 className="font-medium text-sm">Already published</h3>
                <p className="mt-0.5 text-xs opacity-80">
                  Changes are saved as a new draft and won’t alter the live
                  post.
                </p>
              </div>
            )}

            {postData.data?.workspaceId && (
              <div className="mb-6">
                <ReviewBanner
                  organizationId={postData.data.workspaceId}
                  postId={postData.data.id}
                  reviewStatus=""
                />
              </div>
            )}

            <TabsContent className="mt-0" value="global">
              <ContentModule
                socialId="global"
                socialType={SocialTypes.DEFAULT}
              />
            </TabsContent>

            {alternativeContent.map((content) => (
              <TabsContent
                className="mt-0"
                key={content.socialProvider.socialId}
                value={content.socialProvider.socialId}
              >
                <ContentModule
                  socialId={content.socialProvider.socialId}
                  socialType={content.socialProvider.socialType}
                />
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
