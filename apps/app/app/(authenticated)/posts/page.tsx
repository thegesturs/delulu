'use client';

import { Header } from '@/components/layout/header';
import { PostsView } from '@/components/posts/posts-view';
import type { PostLayout } from '@/components/posts/types';
import { api } from '@delulu/database/convex/_generated/api';
import { POST_STATUS, type PostStatus } from '@delulu/database/convex/schemas';
import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Toggle } from '@delulu/design-system/components/ui/toggle';
import { usePaginatedQuery } from 'convex/react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import React, { useEffect } from 'react';
import PostLoading from './post-loading';

type PostStatusFilterType = 'all' | PostStatus;
const ITEMS_PER_PAGE = 10;

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<PostStatusFilterType>('all');
  const [layout, setLayout] = React.useState<PostLayout>('grid');

  // Debounce search term to avoid too many queries
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getPosts,
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      searchTerm: debouncedSearchTerm.trim() || undefined,
    },
    { initialNumItems: ITEMS_PER_PAGE }
  );

  const isLoading = status === 'LoadingMore' || !results;
  const hasError = status === 'LoadingFirstPage' && results === undefined;

  // Get the posts from the paginated results
  const posts = results ?? [];
  const hasMore = status !== 'Exhausted';

  // Implement infinite scroll using Intersection Observer
  const observerTarget = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadMore?.(ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  if (!results && isLoading) {
    return (
      <div className="space-y-4 p-8">
        <Header pages={['Posts']} page="Posts">
          <Button
            onClick={() => {
              /* TODO: Navigate to create post page */
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </Header>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as PostStatusFilterType)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                {Object.values(POST_STATUS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 rounded-lg border">
            <Toggle
              pressed={layout === 'grid'}
              onPressedChange={() => setLayout('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={layout === 'list'}
              onPressedChange={() => setLayout('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
        <PostLoading />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-4 p-8">
        <Header pages={['Posts']} page="Posts">
          <Button
            onClick={() => {
              /* TODO: Navigate to create post page */
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </Header>
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <h3 className="font-semibold">Error loading posts</h3>
          <p>Failed to load posts. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <Header pages={['Posts']} page="Posts">
        <Button
          onClick={() => {
            /* TODO: Navigate to create post page */
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Header>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as PostStatusFilterType)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              {Object.values(POST_STATUS).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 rounded-lg border">
          <Toggle
            pressed={layout === 'grid'}
            onPressedChange={() => setLayout('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={layout === 'list'}
            onPressedChange={() => setLayout('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {posts.length === 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-lg text-muted-foreground">
            No posts found. Try adjusting your filters or creating a new post.
          </p>
        </div>
      )}
      {posts.length > 0 && (
        <>
          <PostsView posts={posts} layout={layout} />
          {/* Loading indicator */}
          {status === 'LoadingMore' && (
            <div className="py-4">
              <PostLoading />
            </div>
          )}
          {/* Intersection observer target */}
          {hasMore && (
            <div
              ref={observerTarget}
              className="h-4 w-full"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </div>
  );
}
