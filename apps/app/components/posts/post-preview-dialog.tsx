'use client';
import { getMediaUrlFromObject } from '@/lib/media-url';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { SocialIcon } from '@delulu/design-system/components/ui/social-icon';
import {
  type SupportedSocialPlatform,
  socialBackgroundColors,
  socialDisplayNames,
} from '@delulu/design-system/lib/social-config';
import { AlertCircle, Calendar, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import type { Post } from './types';

interface PostPreviewDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  SAVED: 'orange',
  SCHEDULED: 'amber',
  PUBLISHED: 'green',
  DELETED: 'red',
  FAILED: 'destructive',
} as const;

export function PostPreviewDialog({
  post,
  open,
  onOpenChange,
}: PostPreviewDialogProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  const firstContent = post.content[0];
  const firstMedia = firstContent?.media?.[0];

  // Reset states when dialog opens/closes or post changes
  React.useEffect(() => {
    if (open) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [open, post._id]);

  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Schedule */}
          <div className="flex items-center justify-between">
            <Badge variant={statusColors[post.status]}>{post.status}</Badge>
            {post.scheduledAt && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(post.scheduledAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Media */}
          {firstMedia && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              {imageLoading && firstMedia.mediaType === 'IMAGE' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {firstMedia.mediaType === 'IMAGE' ? (
                !imageError ? (
                  <Image
                    src={getMediaUrlFromObject(firstMedia)}
                    alt={firstMedia.altText || 'Post media'}
                    fill
                    className={`object-cover transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                      if (process.env.NODE_ENV === 'development') {
                        console.error(
                          `[DEBUG] Failed to load image in preview: ${getMediaUrlFromObject(firstMedia)}`
                        );
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <div className="mx-auto mb-2 h-12 w-12 rounded bg-muted-foreground/20" />
                      <p className="text-sm">Image failed to load</p>
                      <p className="text-xs opacity-70">Check console for details</p>
                    </div>
                  </div>
                )
              ) : (
                <video
                  src={getMediaUrlFromObject(firstMedia)}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  aria-label="Post video content"
                  onError={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.error(
                        `[DEBUG] Failed to load video in preview: ${getMediaUrlFromObject(firstMedia)}`
                      );
                    }
                  }}
                >
                  <track kind="captions" />
                </video>
              )}
            </div>
          )}

          {/* Content */}
          <p className="whitespace-pre-wrap text-base">{firstContent?.text}</p>

          {/* Social Providers */}
          <div className="space-y-3">
            <h3 className="font-medium">Publishing to:</h3>
            <div className="grid gap-3">
              {post.socialProviders?.map((provider) => {
                const socialType = provider.socialType;
                // Skip unsupported platforms
                if (!Object.keys(socialDisplayNames).includes(socialType)) {
                  return null;
                }

                const platformPost = post.platformPosts?.find(
                  (pp) => pp.socialProviderId === provider._id
                );
                const platformPostUrl = platformPost?.platformPostUrl;
                const failureReason = platformPost?.failureReason;

                return (
                  <div
                    key={provider._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          socialBackgroundColors[socialType as SupportedSocialPlatform]
                        } shadow-sm`}>
                          <SocialIcon
                            type={socialType as SupportedSocialPlatform}
                            size="md"
                            className="text-white"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {provider.username ||
                              socialDisplayNames[
                                socialType as SupportedSocialPlatform
                              ]}
                          </span>
                          {!provider.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Disconnected
                            </Badge>
                          )}
                          {failureReason && (
                            <Badge variant="destructive" className="text-xs">
                              Failed
                            </Badge>
                          )}
                        </div>
                        {failureReason && (
                          <div className="flex items-start gap-2 text-destructive text-sm">
                            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{failureReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {provider.isActive && platformPostUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={platformPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Post
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Post Failure Reason */}
            {post.postFailureReason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive text-sm">
                      Post Failed
                    </p>
                    <p className="text-destructive/80 text-sm">
                      {post.postFailureReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
