'use client';

import { api } from '@/trpc/react';
import { Checkbox } from '@delulu/design-system/components/ui/checkbox';
import { Label } from '@delulu/design-system/components/ui/label';
import { Skeleton } from '@delulu/design-system/components/ui/skeleton';
import { cn } from '@delulu/design-system/lib/utils';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  CheckmarkSquare02Icon,
  GridIcon,
  Image02Icon,
  Video02Icon,
} from '@hugeicons-pro/core-solid-rounded';

interface PostSelectorProps {
  socialProviderId: string | null;
  selectedPostIds: string[];
  onSelectionChange: (postIds: string[]) => void;
}

export function PostSelector({
  socialProviderId,
  selectedPostIds,
  onSelectionChange,
}: PostSelectorProps) {
  const {
    data: posts,
    isLoading,
    error,
  } = api.socialProvider.getInstagramPosts.useQuery(
    { socialProviderId: socialProviderId! },
    { enabled: !!socialProviderId }
  );

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
          Select an Instagram account first to choose target posts
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
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-destructive text-sm">
          Failed to load posts: {error.message}
        </p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">
          No posts found for this Instagram account
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* All Posts Option */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border p-3 transition-colors',
          allPostsSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50'
        )}
      >
        <Checkbox
          id="all-posts"
          checked={allPostsSelected}
          onCheckedChange={handleAllPostsToggle}
        />
        <div className="flex flex-1 items-center gap-2">
          <Icon
            icon={CheckmarkSquare02Icon}
            size={18}
            className="text-muted-foreground"
          />
          <Label htmlFor="all-posts" className="cursor-pointer font-medium">
            All Posts
          </Label>
        </div>
        <span className="text-muted-foreground text-xs">
          Automation will trigger on any post
        </span>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted-foreground text-xs">
          or select specific posts
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-3">
        {posts.map((post) => {
          const isSelected = selectedPostIds.includes(post.id);
          const MediaIcon =
            post.mediaType === 'VIDEO'
              ? Video02Icon
              : post.mediaType === 'CAROUSEL_ALBUM'
                ? GridIcon
                : Image02Icon;

          return (
            <button
              key={post.id}
              type="button"
              onClick={() => handlePostToggle(post.id, !isSelected)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-lg border transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              {/* Thumbnail */}
              {post.thumbnailUrl ? (
                <img
                  src={post.thumbnailUrl}
                  alt={post.caption || 'Instagram post'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Icon
                    icon={MediaIcon}
                    size={24}
                    className="text-muted-foreground"
                  />
                </div>
              )}

              {/* Media Type Badge */}
              <div className="absolute top-2 right-2 rounded bg-black/60 p-1">
                <Icon icon={MediaIcon} size={14} className="text-white" />
              </div>

              {/* Selection Overlay */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity',
                  isSelected
                    ? 'bg-primary/20 opacity-100'
                    : 'bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-white bg-black/30'
                  )}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
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
          {selectedPostIds.length} post{selectedPostIds.length !== 1 ? 's' : ''}{' '}
          selected
        </p>
      )}
    </div>
  );
}
