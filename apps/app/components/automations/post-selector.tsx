"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Checkbox } from "@delulu/design-system/components/ui/checkbox";
import { Label } from "@delulu/design-system/components/ui/label";
import { Skeleton } from "@delulu/design-system/components/ui/skeleton";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Calendar03Icon,
  CheckmarkSquare02Icon,
  GridIcon,
  Image02Icon,
  Video02Icon,
} from "@hugeicons/core-free-icons";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useResourceAtom } from "@/state/resources";

interface PostSelectorProps {
  socialProviderId: string | null;
  selectedPostIds: string[];
  onSelectionChange: (postIds: string[]) => void;
  triggerType?: string;
}

export function PostSelector({
  socialProviderId,
  selectedPostIds,
  onSelectionChange,
  triggerType,
}: PostSelectorProps) {
  const isStoryMode = triggerType === "STORY_REPLY";
  const { resources } = useApiClient();
  const { workspaceId } = useWorkspace();

  const insights = useResourceAtom({
    ...resources.analytics.insights(workspaceId ?? "", socialProviderId ?? "", {
      windowDays: 30,
    }),
    enabled: Boolean(workspaceId && socialProviderId && !isStoryMode),
  });
  const scheduled = useResourceAtom({
    ...resources.posts.list(workspaceId ?? "", {
      status: "scheduled",
      limit: 100,
    }),
    enabled: Boolean(workspaceId && socialProviderId && !isStoryMode),
  });
  const items = isStoryMode
    ? []
    : (insights.data?.topPosts.map((post) => ({
        id: post.id,
        caption: post.caption,
        mediaType: post.mediaType,
        thumbnailUrl: null,
      })) ?? []);
  const scheduledPosts =
    scheduled.data?.data
      .filter((post) =>
        post.targets.some((target) => target.connectionId === socialProviderId)
      )
      .map((post) => ({
        id: post.id,
        caption: post.groups[0]?.segments[0]?.text ?? null,
        scheduledAt:
          post.targets.find(
            (target) => target.connectionId === socialProviderId
          )?.scheduledAt ?? null,
        thumbnailUrl: null,
      })) ?? [];
  const isLoading = insights.isPending || scheduled.isPending;
  const error = insights.error ?? scheduled.error;
  const itemLabel = isStoryMode ? "Stories" : "Posts";
  const itemLabelLower = isStoryMode ? "stories" : "posts";

  // Count selected items (excluding pending: prefix for display)
  const selectedCount = selectedPostIds.filter(
    (id) => !id.startsWith("pending:")
  ).length;
  const selectedScheduledCount = selectedPostIds.filter((id) =>
    id.startsWith("pending:")
  ).length;

  const allPostsSelected = selectedPostIds.length === 0;

  const handleAllPostsToggle = (checked: boolean) => {
    if (checked) {
      onSelectionChange([]);
    }
  };

  const handlePostToggle = (postId: string, checked: boolean) => {
    if (checked) {
      // If currently "all posts", start fresh selection
      if (allPostsSelected) {
        onSelectionChange([postId]);
      } else {
        onSelectionChange([...selectedPostIds, postId]);
      }
    } else {
      const newSelection = selectedPostIds.filter((id) => id !== postId);
      onSelectionChange(newSelection);
    }
  };

  if (!socialProviderId) {
    return (
      <div className="rounded-lg border border-border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Select an Instagram account first to choose target {itemLabelLower}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton className="aspect-square rounded-lg" key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-destructive text-sm">
          Failed to load {itemLabelLower}: {error.message}
        </p>
      </div>
    );
  }

  const hasScheduledPosts = !isStoryMode && scheduledPosts.length > 0;

  if ((!items || items.length === 0) && !hasScheduledPosts) {
    return (
      <div className="rounded-lg border border-border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">
          No {itemLabelLower} found for this Instagram account
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* All Posts/Stories Option */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3 transition-colors",
          allPostsSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        )}
      >
        <Checkbox
          checked={allPostsSelected}
          id="all-posts"
          onCheckedChange={handleAllPostsToggle}
        />
        <div className="flex flex-1 items-center gap-2">
          <Icon
            className="text-muted-foreground"
            icon={CheckmarkSquare02Icon}
            size={18}
          />
          <Label className="cursor-pointer font-medium" htmlFor="all-posts">
            All {itemLabel}
          </Label>
        </div>
        <span className="text-muted-foreground text-xs">
          Automation will trigger on any {isStoryMode ? "story" : "post"}
        </span>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted-foreground text-xs">
          or select specific {itemLabelLower}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Posts/Stories Grid */}
      <div className="grid grid-cols-3 gap-3">
        {(items ?? []).map((post) => {
          const isSelected = selectedPostIds.includes(post.id);
          const MediaIcon =
            post.mediaType === "VIDEO"
              ? Video02Icon
              : post.mediaType === "CAROUSEL_ALBUM"
                ? GridIcon
                : Image02Icon;

          return (
            <button
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-muted-foreground/50"
              )}
              key={post.id}
              onClick={() => handlePostToggle(post.id, !isSelected)}
              type="button"
            >
              {/* Thumbnail */}
              {post.thumbnailUrl ? (
                <img
                  alt={
                    post.caption ||
                    `Instagram ${isStoryMode ? "story" : "post"}`
                  }
                  className="h-full w-full object-cover"
                  src={post.thumbnailUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Icon
                    className="text-muted-foreground"
                    icon={MediaIcon}
                    size={24}
                  />
                </div>
              )}

              {/* Media Type Badge */}
              <div className="absolute top-2 right-2 rounded bg-black/60 p-1">
                <Icon className="text-white" icon={MediaIcon} size={14} />
              </div>

              {/* Selection Overlay */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity",
                  isSelected
                    ? "bg-primary/20 opacity-100"
                    : "bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white bg-black/30"
                  )}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Caption Preview on Hover */}
              {post.caption && (
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="line-clamp-2 text-white text-xs">
                    {post.caption}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Scheduled Posts Section */}
      {hasScheduledPosts && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs">
              scheduled posts
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {scheduledPosts.map((post) => {
              const pendingId = `pending:${post.id}`;
              const isSelected = selectedPostIds.includes(pendingId);

              return (
                <button
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                  key={post.id}
                  onClick={() => handlePostToggle(pendingId, !isSelected)}
                  type="button"
                >
                  {/* Thumbnail */}
                  {post.thumbnailUrl ? (
                    <img
                      alt={post.caption || "Scheduled post"}
                      className="h-full w-full object-cover"
                      src={post.thumbnailUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Icon
                        className="text-muted-foreground"
                        icon={Image02Icon}
                        size={24}
                      />
                    </div>
                  )}

                  {/* Scheduled Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="gap-1 text-[10px]" variant="secondary">
                      <Icon icon={Calendar03Icon} size={10} />
                      Scheduled
                    </Badge>
                  </div>

                  {/* Selection Overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity",
                      isSelected
                        ? "bg-primary/20 opacity-100"
                        : "bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white bg-black/30"
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Caption + Scheduled Date on Hover */}
                  <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {post.caption && (
                      <p className="line-clamp-1 text-white text-xs">
                        {post.caption}
                      </p>
                    )}
                    {post.scheduledAt && (
                      <p className="text-[10px] text-white/70">
                        {new Date(post.scheduledAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Selection Summary */}
      {!allPostsSelected && selectedPostIds.length > 0 && (
        <p className="text-center text-muted-foreground text-sm">
          {selectedPostIds.length} item
          {selectedPostIds.length === 1 ? "" : "s"} selected
          {selectedScheduledCount > 0 &&
            ` (${selectedScheduledCount} scheduled)`}
        </p>
      )}
    </div>
  );
}
