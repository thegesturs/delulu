'use client';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
} from 'react-icons/fa';
import type { Post } from './types';
import { FaThreads } from 'react-icons/fa6';

interface PostPreviewDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const socialIcons = {
  TWITTER: FaTwitter,
  LINKEDIN: FaLinkedin,
  INSTAGRAM: FaInstagram,
  TIKTOK: FaTiktok,
  FACEBOOK: FaFacebook,
  THREADS: FaThreads,
} as const;

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
  const firstContent = post.content[0];
  const firstMedia = firstContent?.media?.[0];

  console.log(post.platformPosts, post.postToSocialProviders);

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
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              {firstMedia.mediaType === 'IMAGE' ? (
                <Image
                  src={firstMedia.url || ''}
                  alt={firstMedia.altText || 'Post media'}
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={firstMedia.url}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  aria-label="Post video content"
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
            {post.platformPosts?.length > 0 && (
              <h3 className="font-medium">Publishing to:</h3>
            )}
            <div className="grid gap-3">
              {post.postToSocialProviders.map((provider) => {
                const Icon =
                  socialIcons[
                    provider.socialProvider
                      .socialType as keyof typeof socialIcons
                  ];
                if (!Icon) {
                  return null;
                }

                const platformPostUrl = post.platformPosts?.find(
                  (pp) => pp.platformId === provider.socialProvider.id
                )?.platformPostUrl;

                if (!platformPostUrl) {
                  return null;
                }

                return (
                  <div
                    key={provider.socialProvider.profileId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${provider.socialProvider.isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {provider.socialProvider.username ||
                            provider.socialProvider.socialType}
                        </span>
                        {!provider.socialProvider.isActive && (
                          <span className="text-muted-foreground text-sm">
                            Not connected
                          </span>
                        )}
                      </div>
                    </div>
                    {provider.socialProvider.isActive &&
                      post.status === 'PUBLISHED' && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={platformPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Post
                          </a>
                        </Button>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
