'use client';

import { PostsView } from '@/components/posts/posts-view';
import type { PostLayout } from '@/components/posts/types';
import { api } from '@delulu/database/convex/_generated/api';
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
} from '@delulu/design-system/components/ui/animated-tabs';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import { Toggle } from '@delulu/design-system/components/ui/toggle';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Add01Icon,
  Calendar01Icon,
  CancelCircleIcon,
  DocumentAttachmentIcon,
  GridViewIcon,
  Loading01Icon,
  Menu01Icon,
  TickDouble01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { useQuery } from 'convex-helpers/react/cache';
import { usePaginatedQuery } from 'convex/react';
import Link from 'next/link';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import React, { useEffect } from 'react';
import PostLoading from './post-loading';

const ITEMS_PER_PAGE = 10;

export default function PostsClient() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsStringLiteral([
      'SAVED',
      'SCHEDULED',
      'PUBLISHED',
      'FAILED',
      'PROCESSING',
    ] as const).withDefault('SAVED')
  );
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

  // Fetch dashboard stats for accurate badge counts
  const dashboardStats = useQuery(api.stats.getDashboardStats);

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
            <AnimatedTabs value={statusFilter} className="flex-1">
              <AnimatedTabsList>
                <AnimatedTabsTrigger
                  value="SAVED"
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                >
                  <Icon icon={DocumentAttachmentIcon} size={16} />
                  <span>Draft</span>
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger
                  value="SCHEDULED"
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                >
                  <Icon icon={Calendar01Icon} size={16} />
                  <span>Scheduled</span>
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger
                  value="PUBLISHED"
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                >
                  <Icon icon={TickDouble01Icon} size={16} />
                  <span>Published</span>
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger
                  value="FAILED"
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                >
                  <Icon icon={CancelCircleIcon} size={16} />
                  <span>Failed</span>
                </AnimatedTabsTrigger>
              </AnimatedTabsList>
            </AnimatedTabs>
            <Button>
              <Icon icon={Add01Icon} size={16} className="mr-2" />
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
                <Icon icon={GridViewIcon} size={16} />
              </Toggle>
              <Toggle
                pressed={layout === 'list'}
                onPressedChange={() => setLayout('list')}
                aria-label="List view"
                size="sm"
              >
                <Icon icon={Menu01Icon} size={16} />
              </Toggle>
            </div>
          </div>
          <PostLoading layout={layout} />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div>
        <div className="border-b">
          <div className="container flex items-center justify-between py-3">
            <AnimatedTabs value={statusFilter} className="flex-1">
              <AnimatedTabsList>
                <AnimatedTabsTrigger
                  value="SAVED"
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                >
                  <Icon icon={DocumentAttachmentIcon} size={16} />
                  <span>Draft</span>
                </AnimatedTabsTrigger>
              </AnimatedTabsList>
            </AnimatedTabs>
            <Button>
              <Icon icon={Add01Icon} size={16} className="mr-2" />
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
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="flex items-center justify-between">
          <AnimatedTabs
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(
                value as
                  | 'SAVED'
                  | 'SCHEDULED'
                  | 'PUBLISHED'
                  | 'FAILED'
                  | 'PROCESSING'
              )
            }
            className="no-scrollbar flex-1 overflow-x-auto pt-3"
          >
            <AnimatedTabsList className="flex w-max min-w-full gap-2 lg:grid lg:w-full lg:min-w-0 lg:gap-0">
              <AnimatedTabsTrigger
                value="SAVED"
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
              >
                <Icon icon={DocumentAttachmentIcon} size={16} />
                <span>Draft</span>
                {dashboardStats && dashboardStats.savedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {dashboardStats.savedCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                value="SCHEDULED"
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
              >
                <Icon icon={Calendar01Icon} size={16} />
                <span>Scheduled</span>
                {dashboardStats && dashboardStats.scheduledCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {dashboardStats.scheduledCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                value="PROCESSING"
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
              >
                <Icon icon={Loading01Icon} size={16} />
                <span>Processing</span>
                {dashboardStats && dashboardStats.processingCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {dashboardStats.processingCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                value="PUBLISHED"
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
              >
                <Icon icon={TickDouble01Icon} size={16} />
                <span>Published</span>
                {dashboardStats && dashboardStats.publishedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {dashboardStats.publishedCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                value="FAILED"
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
              >
                <Icon icon={CancelCircleIcon} size={16} />
                <span>Failed</span>
                {dashboardStats && dashboardStats.failedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {dashboardStats.failedCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
            </AnimatedTabsList>
          </AnimatedTabs>

          <Button
            size={'sm'}
            asChild
            className="mx-2 ml-auto"
            variant={'secondary'}
          >
            <Link href={'/posts/create'}>
              <Icon icon={Add01Icon} size={16} className="mr-1" />
              Add Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
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
              <Icon icon={GridViewIcon} size={16} />
            </Toggle>
            <Toggle
              pressed={layout === 'list'}
              onPressedChange={() => setLayout('list')}
              aria-label="List view"
              size="sm"
            >
              <Icon icon={Menu01Icon} size={16} />
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
                <PostLoading layout={layout} />
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
