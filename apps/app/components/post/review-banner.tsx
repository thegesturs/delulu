"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { cn } from "@delulu/design-system/lib/utils";
import { useQuery } from "convex-helpers/react/cache";
import { ReviewActions } from "@/components/posts/review-actions";
import { usePermissions } from "@/hooks/use-permissions";

interface ReviewBannerProps {
  postId: Id<"posts">;
  reviewStatus: string;
  organizationId?: string;
}

export function ReviewBanner({
  postId,
  reviewStatus,
  organizationId,
}: ReviewBannerProps) {
  const { canApprove } = usePermissions();

  const review = useQuery(
    api.post_reviews.getReviewForPost,
    organizationId ? { postId } : "skip"
  );

  if (!organizationId) {
    return null;
  }

  const isPending = reviewStatus === "PENDING";
  const isRejected = reviewStatus === "REJECTED";
  const isApproved = reviewStatus === "APPROVED";

  if (!(isPending || isRejected || isApproved)) {
    return null;
  }

  return (
    <Card
      className={cn(
        "p-2 transition-colors",
        isPending && "border-amber-300 dark:border-amber-700",
        isRejected && "border-red-300 dark:border-red-700",
        isApproved && "border-green-300 dark:border-green-700"
      )}
    >
      <CardContent className="p-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isPending && <Badge variant="amber">Pending Review</Badge>}
              {isRejected && <Badge variant="destructive">Declined</Badge>}
              {isApproved && <Badge variant="green">Approved</Badge>}

              {review?.reviewerName && (isApproved || isRejected) && (
                <span className="text-muted-foreground text-xs">
                  by {review.reviewerName}
                  {review.reviewedAt &&
                    ` on ${new Date(review.reviewedAt).toLocaleDateString()}`}
                </span>
              )}
            </div>

            {isRejected && review?.rejectionReason && (
              <p className="text-sm">
                <span className="font-medium text-red-600 dark:text-red-400">
                  Reason:
                </span>{" "}
                {review.rejectionReason}
              </p>
            )}

            {isApproved && (
              <p className="text-muted-foreground text-xs">
                This post is approved. You can now publish or schedule it.
              </p>
            )}
          </div>

          {isPending && canApprove && <ReviewActions postId={postId} />}
        </div>
      </CardContent>
    </Card>
  );
}
