"use client";

import { api } from "@delulu/database/convex/_generated/api";
import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
} from "@delulu/design-system/components/ui/animated-tabs";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Input } from "@delulu/design-system/components/ui/input";
import { Toggle } from "@delulu/design-system/components/ui/toggle";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add01Icon,
  Calendar01Icon,
  CancelCircleIcon,
  DocumentAttachmentIcon,
  GridViewIcon,
  Loading03Icon,
  Menu01Icon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { usePaginatedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import React, { useEffect } from "react";
import { PostsView } from "@/components/posts/posts-view";
import type { PostLayout } from "@/components/posts/types";
import PostLoading from "./post-loading";

const ITEMS_PER_PAGE = 10;

export default function PostsClient() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringLiteral([
      "SAVED",
      "SCHEDULED",
      "PUBLISHED",
      "FAILED",
      "PROCESSING",
    ] as const).withDefault("SAVED")
  );
  const [layout, setLayout] = React.useState<PostLayout>("list");

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

  const isLoading = status === "LoadingMore" || !results;
  const hasError = status === "LoadingFirstPage" && results === undefined;

  // Get the posts from the paginated results
  const posts = results ?? [];
  const hasMore = status !== "Exhausted";

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
            <AnimatedTabs className="flex-1" value={statusFilter}>
              <AnimatedTabsList>
                <AnimatedTabsTrigger
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                  value="SAVED"
                >
                  <Icon icon={DocumentAttachmentIcon} size={16} />
                  <span>Draft</span>
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                  value="SCHEDULED"
                >
                  <Icon icon={Calendar01Icon} size={16} />
                  <span>Scheduled</span>
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                  value="PUBLISHED"
                >
                  <Icon icon={TickDouble01Icon} size={16} />
                  <span>Published</span>
                </AnimatedTabsTrigger>
                <AnimatedTabsTrigger
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                  value="FAILED"
                >
                  <Icon icon={CancelCircleIcon} size={16} />
                  <span>Failed</span>
                </AnimatedTabsTrigger>
              </AnimatedTabsList>
            </AnimatedTabs>
            <Button>
              <Icon className="mr-2" icon={Add01Icon} size={16} />
              Add Post
            </Button>
          </div>
        </div>

        <div className="container space-y-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              className="max-w-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              value={searchTerm}
            />
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <Toggle
                aria-label="Grid view"
                onPressedChange={() => setLayout("grid")}
                pressed={layout === "grid"}
                size="sm"
              >
                <Icon icon={GridViewIcon} size={16} />
              </Toggle>
              <Toggle
                aria-label="List view"
                onPressedChange={() => setLayout("list")}
                pressed={layout === "list"}
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
            <AnimatedTabs className="flex-1" value={statusFilter}>
              <AnimatedTabsList>
                <AnimatedTabsTrigger
                  className="flex items-center justify-center gap-1.5 px-4 data-[state=active]:text-foreground"
                  value="SAVED"
                >
                  <Icon icon={DocumentAttachmentIcon} size={16} />
                  <span>Draft</span>
                </AnimatedTabsTrigger>
              </AnimatedTabsList>
            </AnimatedTabs>
            <Button>
              <Icon className="mr-2" icon={Add01Icon} size={16} />
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
            className="no-scrollbar flex-1 overflow-x-auto pt-3"
            onValueChange={(value) =>
              setStatusFilter(
                value as
                  | "SAVED"
                  | "SCHEDULED"
                  | "PUBLISHED"
                  | "FAILED"
                  | "PROCESSING"
              )
            }
            value={statusFilter}
          >
            <AnimatedTabsList className="flex w-max min-w-full gap-2 lg:grid lg:w-full lg:min-w-0 lg:gap-0">
              <AnimatedTabsTrigger
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
                value="SAVED"
              >
                <Icon icon={DocumentAttachmentIcon} size={16} />
                <span>Draft</span>
                {dashboardStats && dashboardStats.savedCount > 0 && (
                  <Badge className="ml-1.5" variant="secondary">
                    {dashboardStats.savedCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
                value="SCHEDULED"
              >
                <Icon icon={Calendar01Icon} size={16} />
                <span>Scheduled</span>
                {dashboardStats && dashboardStats.scheduledCount > 0 && (
                  <Badge className="ml-1.5" variant="secondary">
                    {dashboardStats.scheduledCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
                value="PROCESSING"
              >
                <Icon icon={Loading03Icon} size={16} />
                <span>Processing</span>
                {dashboardStats && dashboardStats.processingCount > 0 && (
                  <Badge className="ml-1.5" variant="secondary">
                    {dashboardStats.processingCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
                value="PUBLISHED"
              >
                <Icon icon={TickDouble01Icon} size={16} />
                <span>Published</span>
                {dashboardStats && dashboardStats.publishedCount > 0 && (
                  <Badge className="ml-1.5" variant="secondary">
                    {dashboardStats.publishedCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
              <AnimatedTabsTrigger
                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap px-4 data-[state=active]:text-foreground"
                value="FAILED"
              >
                <Icon icon={CancelCircleIcon} size={16} />
                <span>Failed</span>
                {dashboardStats && dashboardStats.failedCount > 0 && (
                  <Badge className="ml-1.5" variant="secondary">
                    {dashboardStats.failedCount}
                  </Badge>
                )}
              </AnimatedTabsTrigger>
            </AnimatedTabsList>
          </AnimatedTabs>

          <Button
            asChild
            className="mx-2 ml-auto"
            size={"sm"}
            variant={"secondary"}
          >
            <Link href={"/posts/create"}>
              <Icon className="mr-1" icon={Add01Icon} size={16} />
              Add Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            className="max-w-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            value={searchTerm}
          />
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Toggle
              aria-label="Grid view"
              onPressedChange={() => setLayout("grid")}
              pressed={layout === "grid"}
              size="sm"
            >
              <Icon icon={GridViewIcon} size={16} />
            </Toggle>
            <Toggle
              aria-label="List view"
              onPressedChange={() => setLayout("list")}
              pressed={layout === "list"}
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
            <PostsView layout={layout} posts={posts} />
            {/* Loading indicator */}
            {status === "LoadingMore" && (
              <div className="py-4">
                <PostLoading layout={layout} />
              </div>
            )}
            {/* Intersection observer target */}
            {hasMore && (
              <div
                aria-hidden="true"
                className="h-4 w-full"
                ref={observerTarget}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
