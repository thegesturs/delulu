'use client';

import { PostsView } from '@/components/posts/posts-view';
import type { PostLayout } from '@/components/posts/types';
import { api } from '@delulu/database/convex/_generated/api';
import type { PostStatus } from '@delulu/database/convex/schemas';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';
import { Toggle } from '@delulu/design-system/components/ui/toggle';
import { usePaginatedQuery } from 'convex/react';
import {
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Plus,
  Sparkles,
} from 'lucide-react';
import React, { useEffect } from 'react';
import PostLoading from './post-loading';

type PostStatusFilterType = 'all' | PostStatus;
const ITEMS_PER_PAGE = 10;

export default function PostsClient() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<PostStatusFilterType>('all');
  const [layout, setLayout] = React.useState<PostLayout>('list');

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
      <div className="space-y-4">
        <div className="border-b px-8">
          <div className="flex items-center justify-between">
            <Tabs value={statusFilter} className="flex-1">
              <TabsList className="h-auto gap-6 border-0 bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Sparkles className="h-4 w-4" />
                  Suggested
                </TabsTrigger>
                <TabsTrigger
                  value="SAVED"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <FileText className="h-4 w-4" />
                  Draft
                </TabsTrigger>
                <TabsTrigger
                  value="PROCESSING"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Eye className="h-4 w-4" />
                  Review
                </TabsTrigger>
                <TabsTrigger
                  value="SCHEDULED"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Calendar className="h-4 w-4" />
                  Scheduled
                </TabsTrigger>
                <TabsTrigger
                  value="PUBLISHED"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <CheckCircle className="h-4 w-4" />
                  Published
                </TabsTrigger>
                <TabsTrigger
                  value="FAILED"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <CheckCircle className="h-4 w-4" />
                  Failed
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button className="ml-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
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
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-4">
        <div className="border-b px-8">
          <div className="flex items-center justify-between">
            <Tabs value={statusFilter} className="flex-1">
              <TabsList className="h-auto gap-6 border-0 bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Sparkles className="h-4 w-4" />
                  Suggested
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button className="ml-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>
        <div className="px-8">
          <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
            <h3 className="font-semibold">Error loading posts</h3>
            <p>Failed to load posts. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs at the very top */}
      <div className="border-b px-8">
        <div className="flex items-center justify-between">
          <Tabs
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as PostStatusFilterType)
            }
            className="flex-1"
          >
            <TabsList className="h-auto gap-6 border-0 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Sparkles className="h-4 w-4" />
                Suggested
                {posts.length > 0 && statusFilter === 'all' && (
                  <Badge variant="secondary" className="ml-1">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="SAVED"
                className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <FileText className="h-4 w-4" />
                Draft
                {posts.length > 0 && statusFilter === 'SAVED' && (
                  <Badge variant="secondary" className="ml-1">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="PROCESSING"
                className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Eye className="h-4 w-4" />
                Review
                {posts.length > 0 && statusFilter === 'PROCESSING' && (
                  <Badge variant="secondary" className="ml-1">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="SCHEDULED"
                className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Calendar className="h-4 w-4" />
                Scheduled
                {posts.length > 0 && statusFilter === 'SCHEDULED' && (
                  <Badge variant="secondary" className="ml-1">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="PUBLISHED"
                className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <CheckCircle className="h-4 w-4" />
                Published
                {posts.length > 0 && statusFilter === 'PUBLISHED' && (
                  <Badge variant="secondary" className="ml-1">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="FAILED"
                className="gap-2 rounded-none border-transparent border-b-2 bg-transparent px-0 pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <CheckCircle className="h-4 w-4" />
                Failed
                {posts.length > 0 && statusFilter === 'FAILED' && (
                  <Badge variant="secondary" className="ml-1">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => {
              /* TODO: Navigate to create post page */
            }}
            className="ml-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
    </div>
  );
}
