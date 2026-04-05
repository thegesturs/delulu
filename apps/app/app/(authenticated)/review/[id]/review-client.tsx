"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import {
  type SupportedSocialPlatform,
  socialBackgroundColors,
  socialDisplayNames,
} from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft02Icon,
  Calendar01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ReviewActions } from "@/components/posts/review-actions";
import { ReviewActivity } from "@/components/posts/review-activity";
import { useMediaUrl } from "@/hooks/use-media-url";
import { usePermissions } from "@/hooks/use-permissions";

interface ReviewClientProps {
  postId: string;
}

function MediaPreview({
  media,
}: {
  media: {
    bucketKey?: string;
    url?: string;
    mediaType: string;
    altText?: string;
  };
}) {
  const mediaUrl = useMediaUrl(media.bucketKey, media.url);
  const [imageError, setImageError] = React.useState(false);

  if (media.mediaType === "IMAGE") {
    if (imageError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <p className="text-muted-foreground text-sm">Image failed to load</p>
        </div>
      );
    }
    return (
      <Image
        alt={media.altText || "Post media"}
        className="object-cover"
        fill
        onError={() => setImageError(true)}
        src={mediaUrl}
      />
    );
  }

  return (
    <video
      aria-label="Post video content"
      className="h-full w-full object-cover"
      controls
      playsInline
      src={mediaUrl}
    >
      <track kind="captions" />
    </video>
  );
}

export function ReviewClient({ postId }: ReviewClientProps) {
  const { canApprove } = usePermissions();
  const post = useQuery(api.posts.getPostById, {
    id: postId as Id<"posts">,
  });
  const review = useQuery(
    api.post_reviews.getReviewForPost,
    post?.organizationId ? { postId: postId as Id<"posts"> } : "skip"
  );

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="font-medium text-lg">Post not found</p>
          <p className="text-muted-foreground text-sm">
            This post may have been deleted or you don't have access.
          </p>
          <Button asChild variant="outline">
            <Link href="/posts">Back to posts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const firstContent = post.content[0];
  const firstMedia = firstContent?.media?.[0];
  const isPending = post.reviewStatus === "PENDING";
  const isRejected = post.reviewStatus === "REJECTED";
  const isApproved = post.reviewStatus === "APPROVED";

  return (
    <div className="mx-auto max-w-3xl p-4 pb-20 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button asChild className="h-8 w-8" size="icon" variant="ghost">
          <Link href="/posts">
            <Icon icon={ArrowLeft02Icon} size={16} />
          </Link>
        </Button>
        <h1 className="font-semibold text-lg">Review Post</h1>
        <div className="ml-auto flex items-center gap-2">
          {isPending && <Badge variant="amber">Pending Review</Badge>}
          {isRejected && <Badge variant="destructive">Declined</Badge>}
          {isApproved && <Badge variant="green">Approved</Badge>}
          {post.externalSubmissionId && <Badge variant="secondary">API</Badge>}
        </div>
      </div>

      {/* Review actions for admins when pending */}
      {isPending && canApprove && (
        <Card className="mb-6 border-amber-300 dark:border-amber-700">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-sm">This post needs your review</p>
              <p className="text-muted-foreground text-xs">
                Approve to allow publishing, or decline with feedback.
              </p>
            </div>
            <ReviewActions postId={postId as Id<"posts">} />
          </CardContent>
        </Card>
      )}

      {/* Rejection reason */}
      {isRejected && review?.rejectionReason && (
        <Card className="mb-6 border-red-300 dark:border-red-700">
          <CardContent className="p-4">
            <p className="font-medium text-red-600 text-sm dark:text-red-400">
              Declined
            </p>
            <p className="mt-1 text-sm">{review.rejectionReason}</p>
            {review.reviewerName && (
              <p className="mt-1 text-muted-foreground text-xs">
                by {review.reviewerName}
                {review.reviewedAt &&
                  ` on ${new Date(review.reviewedAt).toLocaleDateString()}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post content */}
      <Card className="mb-6">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Schedule info */}
          {post.scheduledAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Icon icon={Calendar01Icon} size={14} />
              Scheduled for {new Date(post.scheduledAt).toLocaleString()}
            </div>
          )}

          {/* Media */}
          {firstMedia && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <MediaPreview media={firstMedia} />
            </div>
          )}

          {/* Additional media */}
          {firstContent?.media && firstContent.media.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {firstContent.media.slice(1).map((media, i) => (
                <div
                  className="relative aspect-square overflow-hidden rounded-md bg-muted"
                  key={`media-${i}`}
                >
                  <MediaPreview media={media} />
                </div>
              ))}
            </div>
          )}

          {/* Text content */}
          {firstContent?.text && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">
              {firstContent.text}
            </p>
          )}

          {/* Platforms */}
          {post.socialProviders && post.socialProviders.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Publishing to
              </p>
              <div className="flex flex-wrap gap-2">
                {post.socialProviders.map((provider) => {
                  const socialType = provider.socialType;
                  if (!Object.keys(socialDisplayNames).includes(socialType)) {
                    return null;
                  }
                  return (
                    <div
                      className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
                      key={provider._id}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded ${
                          socialBackgroundColors[
                            socialType as SupportedSocialPlatform
                          ]
                        }`}
                      >
                        <SocialIcon
                          className="text-white"
                          size="sm"
                          type={socialType as SupportedSocialPlatform}
                        />
                      </div>
                      <span className="text-sm">
                        {provider.username ||
                          socialDisplayNames[
                            socialType as SupportedSocialPlatform
                          ]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity timeline */}
      {post.organizationId && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <ReviewActivity postId={postId as Id<"posts">} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
