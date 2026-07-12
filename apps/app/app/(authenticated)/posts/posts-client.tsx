"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@delulu/design-system/components/ui/select";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add01Icon,
  Calendar01Icon,
  CancelCircleIcon,
  DocumentAttachmentIcon,
  Loading03Icon,
  TaskDone01Icon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { ReviewQueue } from "@/components/posts/review-queue";
import { useApiClient } from "@/components/providers/api-client";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { usePermissions } from "@/hooks/use-permissions";

const statuses = [
  { value: "draft", label: "Draft", icon: DocumentAttachmentIcon },
  { value: "scheduled", label: "Scheduled", icon: Calendar01Icon },
  { value: "publishing", label: "Processing", icon: Loading03Icon },
  { value: "published", label: "Published", icon: TickDouble01Icon },
  { value: "failed", label: "Failed", icon: CancelCircleIcon },
  { value: "review", label: "Review", icon: TaskDone01Icon },
] as const;

type StatusFilter = (typeof statuses)[number]["value"];

export default function PostsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringLiteral(statuses.map(({ value }) => value)).withDefault(
      "draft"
    )
  );
  const { canApprove, isPersonal, canCreate } = usePermissions();
  const {
    workspaceId,
    isPending: isWorkspacePending,
    error: workspaceError,
  } = useActiveWorkspace();
  const { resources } = useApiClient();
  const showReviewTab = canApprove && !isPersonal;

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearchTerm(searchTerm.trim()),
      300
    );
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const posts = useQuery({
    ...resources.posts.list(workspaceId ?? "", {
      limit: 100,
      status: statusFilter === "review" ? undefined : statusFilter,
    }),
    enabled: Boolean(workspaceId) && statusFilter !== "review",
    staleTime: 30_000,
    retry: 2,
  });
  const reviewQueue = useQuery({
    ...resources.reviews.queue(workspaceId ?? "", { limit: 1 }),
    enabled: Boolean(workspaceId) && showReviewTab,
    staleTime: 15_000,
    retry: 2,
  });

  const filteredPosts = (posts.data?.data ?? []).filter((post) => {
    if (!debouncedSearchTerm) {
      return true;
    }
    const haystack = post.groups
      .flatMap((group) => group.segments.map((segment) => segment.text))
      .join(" ")
      .toLowerCase();
    return haystack.includes(debouncedSearchTerm.toLowerCase());
  });
  const error = workspaceError ?? posts.error;

  if (isWorkspacePending || (statusFilter !== "review" && posts.isPending)) {
    return <PostsLoading />;
  }

  if (!workspaceId || error) {
    return (
      <div className="container py-10">
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <h3 className="font-semibold">Unable to load this workspace</h3>
          <p className="text-sm">
            {error?.message ?? "Select a workspace and try again."}
          </p>
          <Button
            className="mt-3"
            onClick={() => posts.refetch()}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="flex items-center justify-between gap-3 p-3">
          <Select
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            value={statusFilter}
          >
            <SelectTrigger className="w-56" size="default">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses
                .filter(({ value }) => value !== "review" || showReviewTab)
                .map(({ value, label, icon }) => (
                  <SelectItem key={value} value={value}>
                    <Icon icon={icon} size={16} />
                    <span>{label}</span>
                    {value === "review" &&
                      (reviewQueue.data?.total ?? 0) > 0 && (
                        <Badge variant="secondary">
                          {reviewQueue.data?.total}
                        </Badge>
                      )}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {canCreate && (
            <Button asChild size="sm" variant="secondary">
              <Link href="/post">
                <Icon className="mr-1" icon={Add01Icon} size={16} />
                Add Post
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {statusFilter === "review" ? (
          <ReviewQueue />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Input
                className="max-w-sm"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search posts..."
                value={searchTerm}
              />
              {posts.isFetching && !posts.isPending && (
                <span className="text-muted-foreground text-xs">
                  Refreshing…
                </span>
              )}
              {posts.isStale && <Badge variant="outline">Cached</Badge>}
            </div>
            {filteredPosts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No posts found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post) => {
                  const text = post.groups
                    .flatMap((group) => group.segments)
                    .find((segment) => segment.text.trim())?.text;
                  const scheduledAt = post.targets.find(
                    (target) => target.scheduledAt
                  )?.scheduledAt;
                  return (
                    <Card key={post.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary">
                            {post.status.replaceAll("_", " ")}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {new Date(post.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="line-clamp-3 min-h-12 text-sm">
                          {text || "Untitled post"}
                        </p>
                        {scheduledAt && (
                          <p className="text-muted-foreground text-xs">
                            Scheduled {new Date(scheduledAt).toLocaleString()}
                          </p>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/post/${post.id}`}>Open post</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PostsLoading() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div className="h-36 animate-pulse rounded-lg bg-muted" key={item} />
      ))}
    </div>
  );
}
