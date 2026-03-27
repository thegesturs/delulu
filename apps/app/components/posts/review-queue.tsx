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
import { ArrowRight01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { useMediaUrl } from "@/hooks/use-media-url";
import { ReviewActions } from "./review-actions";

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

function ReviewCardThumbnail({
  media,
}: {
  media?: { bucketKey?: string; url?: string; mediaType: string };
}) {
  const mediaUrl = useMediaUrl(media?.bucketKey, media?.url);

  if (!media) {
    return null;
  }

  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
      {media.mediaType === "IMAGE" ? (
        <img alt="" className="h-full w-full object-cover" src={mediaUrl} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs">
          Video
        </div>
      )}
    </div>
  );
}

export function ReviewQueue() {
  const pendingReviews = useQuery(api.post_reviews.getPendingReviews);

  if (!pendingReviews) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            className="h-20 animate-pulse rounded-lg border bg-muted/30"
            key={i}
          />
        ))}
      </div>
    );
  }

  if (pendingReviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <div className="rounded-full bg-green-500/10 p-3">
          <div className="h-6 w-6 rounded-full bg-green-500/20" />
        </div>
        <p className="font-medium text-sm">All caught up</p>
        <p className="text-muted-foreground text-xs">No posts pending review</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {pendingReviews.map((review) => {
        const post = review.post;
        const firstContent = post.content[0];
        const firstMedia = firstContent?.media?.[0];

        return (
          <div
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
            key={review._id}
          >
            {/* Thumbnail */}
            <ReviewCardThumbnail media={firstMedia} />

            {/* Content — clickable, goes to edit page */}
            <Link className="min-w-0 flex-1" href={`/post/${post._id}`}>
              <p className="truncate font-medium text-sm">
                {firstContent?.text || "Untitled post"}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
                <span>{review.submitterName}</span>
                <span>&middot;</span>
                <span>{timeAgo(review.submittedAt)}</span>
              </div>
            </Link>

            {/* Platforms */}
            <div className="hidden items-center gap-1 sm:flex">
              {post.socialProviders?.slice(0, 4).map((provider) => {
                const socialType = provider.socialType;
                if (!Object.keys(socialDisplayNames).includes(socialType)) {
                  return null;
                }
                return (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50"
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

            {/* Open in editor */}
            <Button
              asChild
              className="h-8 w-8 shrink-0"
              size="icon"
              variant="ghost"
            >
              <Link href={`/post/${post._id}`}>
                <Icon icon={ArrowRight01Icon} size={14} />
              </Link>
            </Button>

            {/* Quick actions */}
            <ReviewActions
              compact
              onReviewed={() => {
                //do stuff
              }}
              postId={post._id}
            />
          </div>
        );
      })}
    </div>
  );
}
