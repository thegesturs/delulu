"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
} from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowRight01Icon,
  TaskDone01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { ReviewActions } from "@/components/posts/review-actions";
import { usePermissions } from "@/hooks/use-permissions";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

export function PendingReviews() {
  const { canApprove, isPersonal } = usePermissions();
  const pendingReviews = useQuery(api.post_reviews.getPendingReviews);

  // Don't show in personal workspace
  if (isPersonal) {
    return null;
  }

  // Don't show if no pending reviews
  if (!pendingReviews || pendingReviews.length === 0) {
    return null;
  }

  const displayedReviews = pendingReviews.slice(0, 3);
  const hasMore = pendingReviews.length > 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-amber-500" icon={TaskDone01Icon} size={16} />
          <h3 className="font-medium text-sm">
            {canApprove ? "Pending Reviews" : "Your Submissions"}
          </h3>
          <Badge variant="amber">{pendingReviews.length}</Badge>
        </div>
        <Link
          className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          href="/posts?status=REVIEW"
        >
          View all
          <Icon icon={ArrowRight01Icon} size={12} />
        </Link>
      </div>

      <div className="divide-y rounded-lg border">
        {displayedReviews.map((review) => {
          const post = review.post;
          const firstContent = post.content[0];

          return (
            <div
              className="flex items-center gap-3 px-3 py-2.5"
              key={review._id}
            >
              {/* Content — links to edit page for full review */}
              <Link className="min-w-0 flex-1" href={`/post/${post._id}`}>
                <p className="truncate text-sm">
                  {firstContent?.text || "Untitled post"}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
                  <span>{review.submitterName}</span>
                  <span>&middot;</span>
                  <span>{timeAgo(review.submittedAt)}</span>
                </div>
              </Link>

              {/* Platforms */}
              <div className="hidden items-center gap-0.5 sm:flex">
                {post.socialProviders?.slice(0, 3).map((provider) => {
                  const socialType = provider.socialType;
                  if (!Object.keys(socialDisplayNames).includes(socialType)) {
                    return null;
                  }
                  return (
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/50"
                      key={provider._id}
                    >
                      <SocialIcon
                        className="text-foreground"
                        size="sm"
                        type={socialType as SupportedSocialPlatform}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Actions for admins */}
              {canApprove && (
                <ReviewActions
                  compact
                  onReviewed={() => {
                    // Reactivity handles re-render
                  }}
                  postId={post._id}
                />
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <Button asChild className="w-full" size="sm" variant="ghost">
          <Link href="/posts?status=REVIEW">
            View {pendingReviews.length - 3} more
          </Link>
        </Button>
      )}
    </div>
  );
}
