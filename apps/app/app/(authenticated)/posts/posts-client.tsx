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
  FileText,
  LayoutGrid,
  List,
  Plus,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import PostLoading from './post-loading';

type PostStatusFilterType = PostStatus;
const ITEMS_PER_PAGE = 10;

export default function PostsClient() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<PostStatusFilterType>('SAVED');
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
      status: statusFilter,
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
      <div>
        <div className="border-b">
          <div className="container flex items-center justify-between py-3">
            <Tabs value={statusFilter} className="flex-1">
              <TabsList className="h-auto gap-1 border-0 bg-transparent p-0">
                <TabsTrigger
                  value="SAVED"
                  className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <FileText className="h-4 w-4" />
                  <span>Draft</span>
                </TabsTrigger>
                <TabsTrigger
                  value="SCHEDULED"
                  className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Scheduled</span>
                </TabsTrigger>
                <TabsTrigger
                  value="PUBLISHED"
                  className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Published</span>
                </TabsTrigger>
                <TabsTrigger
                  value="FAILED"
                  className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Failed</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>

        <div className="container space-y-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <Toggle
                pressed={layout === 'grid'}
                onPressedChange={() => setLayout('grid')}
                aria-label="Grid view"
                size="sm"
              >
                <LayoutGrid className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={layout === 'list'}
                onPressedChange={() => setLayout('list')}
                aria-label="List view"
                size="sm"
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
      <div>
        <div className="border-b">
          <div className="container flex items-center justify-between py-3">
            <Tabs value={statusFilter} className="flex-1">
              <TabsList className="h-auto gap-1 border-0 bg-transparent p-0">
                <TabsTrigger
                  value="SAVED"
                  className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <FileText className="h-4 w-4" />
                  <span>Draft</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </div>
        </div>
        <div className="container py-4">
          <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
            <h3 className="font-semibold">Error loading posts</h3>
            <p>Failed to load posts. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs at the very top */}
      <div className="border-b">
        <div className="container flex items-center justify-between pt-3">
          <Tabs
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as PostStatusFilterType)
            }
            className="flex-1"
          >
            <TabsList className="h-auto gap-1 border-0 bg-transparent p-0">
              <TabsTrigger
                value="SAVED"
                className="relative gap-1.5 rounded-none border-transparent bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground"
              >
                <FileText className="h-4 w-4" />
                <span>Draft</span>
                {posts.length > 0 && statusFilter === 'SAVED' && (
                  <Badge variant="secondary" className="ml-1.5">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="SCHEDULED"
                className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Calendar className="h-4 w-4" />
                <span>Scheduled</span>
                {posts.length > 0 && statusFilter === 'SCHEDULED' && (
                  <Badge variant="secondary" className="ml-1.5">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="PUBLISHED"
                className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Published</span>
                {posts.length > 0 && statusFilter === 'PUBLISHED' && (
                  <Badge variant="secondary" className="ml-1.5">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="FAILED"
                className="relative gap-1.5 rounded-none border-transparent border-b-2 bg-transparent px-4 pt-0 pb-3 transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <XCircle className="h-4 w-4" />
                <span>Failed</span>
                {posts.length > 0 && statusFilter === 'FAILED' && (
                  <Badge variant="secondary" className="ml-1.5">
                    {posts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button size={'sm'} asChild>
            <Link href={'/posts/create'}>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="container space-y-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Toggle
              pressed={layout === 'grid'}
              onPressedChange={() => setLayout('grid')}
              aria-label="Grid view"
              size="sm"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={layout === 'list'}
              onPressedChange={() => setLayout('list')}
              aria-label="List view"
              size="sm"
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        {posts.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No posts found. Try creating a new post.
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
