'use client';

import { getMediaUrlFromObject } from '@/lib/media-url';
import { api as TrpcApi } from '@/trpc/react';
import { api } from '@delulu/database/convex/_generated/api';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card } from '@delulu/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import { SocialIcon } from '@delulu/design-system/components/ui/social-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
} from '@delulu/design-system/lib/social-config';
import { useMutation } from 'convex/react';
import { Calendar, Eye, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import DeletePostAlert from '../alerts/delete-post';
import { PostPreviewDialog } from './post-preview-dialog';
import type { Post, PostLayout } from './types';

interface PostCardProps {
  post: Post;
  layout?: PostLayout;
}

export function PostCard({ post, layout = 'grid' }: PostCardProps) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [openDeletePost, setOpenDeletePost] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const router = useRouter();

  const softDeletePost = useMutation(api.posts.deletePost);
  const createPostFromPostIdMutation =
    TrpcApi.socialProvider.createPostFromPostId.useMutation({
      onSuccess: () => {
        toast.success('Your post is being published. It will be posted soon.');
        setShowPreview(false);
      },
      onError: (error) => {
        toast.error('Failed to publish post');
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }
      },
    });
  const [isDeleting, setIsDeleting] = React.useState(false);

  const statusColors = {
    SAVED: 'orange',
    SCHEDULED: 'amber',
    PUBLISHED: 'green',
    DELETED: 'red',
    FAILED: 'destructive',
  } as const;

  const postId = post._id;
  const postStatus = post.status;
  const postContent = post.content;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await softDeletePost({ postId });
      setOpenDeletePost(false);
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/post/${id}`);
  };

  const handleScheduleChange = (id: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Change schedule for post:', id);
    }
  };

  const handlePublish = async (id: string) => {
    toast.loading('Publishing post...');
    await createPostFromPostIdMutation.mutateAsync({ postId: id });
    toast.dismiss();
  };

  const renderActionItems = () => {
    const items = [];

    switch (postStatus) {
      case 'SAVED':
        items.push(
          <DropdownMenuItem key="edit" onClick={() => handleEdit(postId)}>
            Edit
          </DropdownMenuItem>,
          <DropdownMenuItem
            key="publish"
            onClick={() => handlePublish(postId)}
            disabled={createPostFromPostIdMutation.isPending}
          >
            {createPostFromPostIdMutation.isPending
              ? 'Publishing...'
              : 'Publish now'}
          </DropdownMenuItem>,
          <DropdownMenuItem
            key="schedule"
            onClick={() => handleScheduleChange(postId)}
          >
            Schedule
          </DropdownMenuItem>
        );
        break;
      case 'SCHEDULED':
        items.push(
          <DropdownMenuItem key="edit" onClick={() => handleEdit(postId)}>
            Edit
          </DropdownMenuItem>,
          <DropdownMenuItem
            key="schedule"
            onClick={() => handleScheduleChange(postId)}
          >
            Reschedule
          </DropdownMenuItem>
        );
        break;
      default:
        break;
    }

    // Add delete action for all statuses
    if (items.length > 0) {
      items.push(<DropdownMenuSeparator key="separator" />);
    }
    items.push(
      <DropdownMenuItem
        key="delete"
        className="text-destructive"
        onClick={() => setOpenDeletePost(true)}
      >
        Delete
      </DropdownMenuItem>
    );

    return items;
  };

  const firstContent = postContent[0];
  const firstMedia = firstContent?.media?.[0];

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => setShowPreview(true)}>
        <Eye className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {renderActionItems()}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <Card className="group relative py-2 transition-shadow hover:shadow-md">
        <div className="flex h-full flex-col px-4 py-2">
          {layout === 'list' ? (
            <div className="flex w-full items-center gap-x-4">
              {/* Status */}
              <div className="flex-shrink-0">
                <Badge variant={statusColors[postStatus]}>{postStatus}</Badge>
              </div>

              {/* Content (Text) */}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium text-sm">
                  {firstContent?.text || 'Untitled Post'}
                </p>
              </div>

              {/* Scheduled At - flex-shrink-0 to prevent shrinking */}
              {post.scheduledAt && (
                <div className="flex flex-shrink-0 items-center gap-1 text-muted-foreground text-xs">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.scheduledAt).toLocaleDateString()}
                </div>
              )}

              {/* Social Icons - flex-shrink-0 */}
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {post.socialProviders?.slice(0, 3).map((provider) => {
                  const socialType = provider.socialType;
                  if (!Object.keys(socialDisplayNames).includes(socialType)) {
                    return null;
                  }
                  return (
                    <Tooltip key={provider._id}>
                      <TooltipTrigger>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/30">
                          <SocialIcon
                            type={socialType as SupportedSocialPlatform}
                            size="sm"
                            className="text-foreground"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="font-medium">
                            {
                              socialDisplayNames[
                                socialType as SupportedSocialPlatform
                              ]
                            }
                          </div>
                          {provider.username && (
                            <div className="text-primary-foreground/70 text-xs">
                              @{provider.username}
                            </div>
                          )}
                          {!provider.isActive && (
                            <div className="text-destructive text-xs">
                              Not connected
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {(post.socialProviders?.length || 0) > 3 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/30 font-medium text-foreground text-xs">
                        +{(post.socialProviders?.length || 0) - 3}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {(post.socialProviders?.length || 0) - 3} more platforms
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Actions - flex-shrink-0 */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <ActionButtons />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col gap-3">
              {/* Media Preview for Grid */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {firstMedia ? (
                  <>
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
                                `[DEBUG] Failed to load image: ${getMediaUrlFromObject(firstMedia)}`
                              );
                            }
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <div className="text-center text-muted-foreground">
                            <div className="mx-auto mb-2 h-8 w-8 rounded bg-muted-foreground/20" />
                            <p className="text-xs">Image failed to load</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <video
                        src={getMediaUrlFromObject(firstMedia)}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        playsInline
                        onError={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.error(
                              `[DEBUG] Failed to load video: ${getMediaUrlFromObject(firstMedia)}`
                            );
                          }
                        }}
                      />
                    )}
                    {(firstContent?.media?.length || 0) > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute right-2 bottom-2"
                      >
                        +{(firstContent?.media?.length || 0) - 1}
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-12 w-12 rounded-lg bg-muted-foreground/10" />
                      <span className="text-xs">No media</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <Badge variant={statusColors[postStatus]}>{postStatus}</Badge>
                <ActionButtons />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-sm leading-relaxed">
                  {firstContent?.text || 'No content'}
                </p>
              </div>

              {/* Schedule Info & Social Providers */}
              <div className="mt-auto flex items-center justify-between text-muted-foreground text-xs">
                {post.scheduledAt ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(post.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-1.5">
                  {post.socialProviders?.slice(0, 3).map((provider) => {
                    const socialType = provider.socialType;
                    if (!Object.keys(socialDisplayNames).includes(socialType)) {
                      return null;
                    }
                    return (
                      <Tooltip key={provider._id}>
                        <TooltipTrigger>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/30">
                            <SocialIcon
                              type={socialType as SupportedSocialPlatform}
                              size="sm"
                              className="text-foreground"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <div className="font-medium">
                              {
                                socialDisplayNames[
                                  socialType as SupportedSocialPlatform
                                ]
                              }
                            </div>
                            {provider.username && (
                              <div className="text-foreground/70 text-xs">
                                @{provider.username}
                              </div>
                            )}
                            {!provider.isActive && (
                              <div className="text-destructive text-xs">
                                Not connected
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {(post.socialProviders?.length || 0) > 3 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/30 font-medium text-foreground text-xs">
                          +{(post.socialProviders?.length || 0) - 3}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {(post.socialProviders?.length || 0) - 3} more platforms
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      <DeletePostAlert
        open={openDeletePost}
        onOpenChange={setOpenDeletePost}
        onConfirm={handleDelete}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        isLoading={isDeleting}
      />

      <PostPreviewDialog
        post={post}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </>
  );
}
