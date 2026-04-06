"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@delulu/design-system/components/ui/animated-tabs";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
  socialIcons,
} from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft02Icon,
  Calendar01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { useState } from "react";
import { ReviewActions } from "@/components/posts/review-actions";
import { ReviewActivity } from "@/components/posts/review-activity";
import { usePermissions } from "@/hooks/use-permissions";
import { ReviewPlatformPreview } from "./review-platform-preview";

interface ReviewClientProps {
  postId: string;
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
  const [activePlatform, setActivePlatform] =
    useState<SupportedSocialPlatform | null>(null);

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-[600px] animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="font-medium text-lg">Post not found</p>
          <p className="text-muted-foreground text-sm">
            This post may have been deleted or you don&apos;t have access.
          </p>
          <Button asChild variant="outline">
            <Link href="/posts">Back to posts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPending = post.reviewStatus === "PENDING";
  const isRejected = post.reviewStatus === "REJECTED";
  const isApproved = post.reviewStatus === "APPROVED";

  const platforms = (post.socialProviders ?? [])
    .filter((p) => Object.keys(socialDisplayNames).includes(p.socialType))
    .map((p) => p.socialType as SupportedSocialPlatform);

  const currentPlatform =
    activePlatform && platforms.includes(activePlatform)
      ? activePlatform
      : (platforms[0] ?? null);

  const postData = {
    content: post.content.map((c) => ({
      text: c.text ?? "",
      media: (c.media ?? []).map((m) => ({
        url: m.url,
        bucketKey: m.bucketKey,
        mediaType: m.mediaType as "IMAGE" | "VIDEO",
        altText: m.altText,
      })),
    })),
    socialProviders: post.socialProviders?.map((p) => ({
      _id: p._id,
      socialType: p.socialType,
      username: p.username,
      fullName: p.fullName,
      profileImage: p.profileImage,
    })),
  };

  const tabClass =
    "rounded-none border-0 border-transparent border-b-2 bg-transparent px-0 py-2 font-medium text-muted-foreground text-sm data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current";

  return (
    <div className="mx-auto max-w-4xl p-4 pb-20 sm:p-6">
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
          {post.scheduledAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Icon icon={Calendar01Icon} size={14} />
              {new Date(post.scheduledAt).toLocaleDateString()}
            </div>
          )}
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

      {/* Preview + Activity tabs */}
      <Card>
        <Tabs className="w-full px-3" defaultValue="preview">
          <TabsList
            className={cn(
              "grid w-full rounded-none border-b bg-transparent p-0",
              post.organizationId ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            <TabsTrigger className={tabClass} value="preview">
              Preview
            </TabsTrigger>
            {post.organizationId && (
              <TabsTrigger className={tabClass} value="activity">
                Activity
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent className="mt-0 space-y-0" value="preview">
            {currentPlatform ? (
              <>
                {/* Platform selector pills */}
                {platforms.length > 1 && (
                  <div className="flex flex-wrap gap-2 px-2 pt-3">
                    {platforms.map((platform) => {
                      const IconComponent = socialIcons[platform];
                      const isActive = platform === currentPlatform;
                      return (
                        <button
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-colors",
                            isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:bg-accent"
                          )}
                          key={platform}
                          onClick={() => setActivePlatform(platform)}
                          type="button"
                        >
                          {IconComponent && (
                            <IconComponent className="h-3.5 w-3.5" />
                          )}
                          {socialDisplayNames[platform]}
                        </button>
                      );
                    })}
                  </div>
                )}
                <ReviewPlatformPreview
                  postData={postData}
                  socialType={currentPlatform}
                />
              </>
            ) : (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                No platforms selected
              </div>
            )}
          </TabsContent>

          {post.organizationId && (
            <TabsContent className="mt-0" value="activity">
              <CardContent className="px-1 pt-4">
                <ReviewActivity postId={postId as Id<"posts">} />
              </CardContent>
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
