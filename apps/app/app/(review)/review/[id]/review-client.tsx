"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft02Icon,
  Calendar01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ReviewActions } from "@/components/posts/review-actions";
import { ReviewActivity } from "@/components/posts/review-activity";
import { useApiClient } from "@/components/providers/api-client";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { usePermissions } from "@/hooks/use-permissions";

export function ReviewClient({ postId }: { postId: string }) {
  const { canApprove } = usePermissions();
  const { workspaceId, isPending: isWorkspacePending } = useActiveWorkspace();
  const { resources } = useApiClient();
  const post = useQuery({
    ...resources.posts.get(workspaceId ?? "", postId),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
    retry: 2,
  });
  const review = useQuery({
    ...resources.reviews.forPost(workspaceId ?? "", postId),
    enabled: Boolean(workspaceId),
    staleTime: 15_000,
    retry: 2,
  });

  if (isWorkspacePending || post.isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }
  if (post.isError || !workspaceId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-destructive/40 p-5 text-destructive">
          <p>
            {post.error?.message ?? "Select a workspace to view this post."}
          </p>
          <Button
            className="mt-3"
            onClick={() => post.refetch()}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const pendingReview = review.data?.status === "pending";
  return (
    <div className="mx-auto max-w-4xl p-4 pb-20 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild className="h-8 w-8" size="icon" variant="ghost">
          <Link href="/posts">
            <Icon icon={ArrowLeft02Icon} size={16} />
          </Link>
        </Button>
        <h1 className="font-semibold text-lg">Review Post</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={pendingReview ? "amber" : "secondary"}>
            {review.data?.status ?? "not submitted"}
          </Badge>
          {post.isFetching && <Badge variant="outline">Refreshing</Badge>}
        </div>
      </div>
      {pendingReview && canApprove && (
        <Card className="mb-6 border-amber-300 dark:border-amber-700">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-sm">This post needs your review</p>
              <p className="text-muted-foreground text-xs">
                Approve it or decline with actionable feedback.
              </p>
            </div>
            <ReviewActions postId={postId} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="space-y-5 p-5">
          {post.data.groups.map((group) => (
            <section className="space-y-3" key={group.id}>
              {group.segments.map((segment, index) => (
                <div
                  className="rounded-lg border bg-muted/20 p-4"
                  key={`${group.id}:${index}`}
                >
                  <p className="whitespace-pre-wrap text-sm">
                    {segment.text || "No text"}
                  </p>
                  {segment.media.length > 0 && (
                    <p className="mt-2 text-muted-foreground text-xs">
                      {segment.media.length} media item
                      {segment.media.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              ))}
            </section>
          ))}
          <div className="flex flex-wrap gap-2">
            {post.data.targets.map((target) => (
              <Badge key={target.id} variant="outline">
                {target.settings.platform}
                {target.scheduledAt && (
                  <span className="ml-1 inline-flex items-center gap-1">
                    <Icon icon={Calendar01Icon} size={12} />
                    {new Date(target.scheduledAt).toLocaleString()}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardContent className="p-5">
          <ReviewActivity postId={postId} />
        </CardContent>
      </Card>
    </div>
  );
}
