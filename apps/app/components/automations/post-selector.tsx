"use client";

import { Checkbox } from "@delulu/design-system/components/ui/checkbox";
import { Label } from "@delulu/design-system/components/ui/label";
import { Skeleton } from "@delulu/design-system/components/ui/skeleton";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  CheckmarkSquare02Icon,
  GridIcon,
  Image02Icon,
  Video02Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { api } from "@/trpc/react";

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

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = api.socialProvider.getInstagramPosts.useQuery(
    { socialProviderId: socialProviderId! },
    { enabled: !!socialProviderId && !isStoryMode }
  );

  const {
    data: stories,
    isLoading: storiesLoading,
    error: storiesError,
  } = api.socialProvider.getInstagramStories.useQuery(
    { socialProviderId: socialProviderId! },
    { enabled: !!socialProviderId && isStoryMode }
  );

  const items = isStoryMode ? stories : posts;
  const isLoading = isStoryMode ? storiesLoading : postsLoading;
  const error = isStoryMode ? storiesError : postsError;
  const itemLabel = isStoryMode ? "Stories" : "Posts";
  const itemLabelLower = isStoryMode ? "stories" : "posts";

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

  if (!items || items.length === 0) {
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
        {items.map((post) => {
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

      {/* Selection Summary */}
      {!allPostsSelected && selectedPostIds.length > 0 && (
        <p className="text-center text-muted-foreground text-sm">
          {selectedPostIds.length} {isStoryMode ? "stor" : "post"}
          {selectedPostIds.length !== 1
            ? isStoryMode
              ? "ies"
              : "s"
            : isStoryMode
              ? "y"
              : ""}{" "}
          selected
        </p>
      )}
    </div>
  );
}
