'use client';

import { api } from '@/trpc/react';
import type { ApiPostContentItem } from '@delulu/api/db/types/post.types';
import type { PostStatus } from '@delulu/database/schema';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';
import { Calendar, Eye, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { toast } from 'sonner';
import DeletePostAlert from '../alerts/delete-post';
import { PostPreviewDialog } from './post-preview-dialog';
import type { Post, PostLayout } from './types';

interface PostCardProps {
  post: Post;
  layout?: PostLayout;
}

const socialIcons = {
  TWITTER: FaTwitter,
  LINKEDIN: FaLinkedin,
  INSTAGRAM: FaInstagram,
} as const;

export function PostCard({ post, layout = 'grid' }: PostCardProps) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [openDeletePost, setOpenDeletePost] = React.useState(false);
  const utils = api.useUtils();
  const router = useRouter();
  const { mutateAsync: softDeletePost, isPending: isDeleting } =
    api.post.softDeletePost.useMutation({
      onSuccess: () => {
        setOpenDeletePost(false);
        toast.success('Post deleted successfully');
        utils.post.getPostsByUserId.invalidate();
      },
      onError: () => {
        toast.error('Failed to delete post');
      },
    });
  const { mutateAsync: publishPost, isPending: isPublishing } =
    api.socialProvider.createPostFromPostId.useMutation({
      onSuccess: () => {
        toast.success('Your post is being published. It will be posted soon.');
        utils.post.getPostsByUserId.invalidate();
        setShowPreview(false);
      },
      onError: () => {
        toast.error('Failed to publish post');
      },
    });

  const statusColors = {
    SAVED: 'orange',
    SCHEDULED: 'amber',
    PUBLISHED: 'green',
    DELETED: 'red',
    FAILED: 'destructive',
  } as const;

  const postId = post.id as string;
  const postStatus = post.status as PostStatus;
  const postContent = post.content as ApiPostContentItem[];

  const handleDelete = async () => {
    await softDeletePost({ id: postId });
  };

  const handleEdit = (id: string) => {
    router.push(`/post/${id}`);
  };

  const handleScheduleChange = (id: string) => {
    console.log('Change schedule for post:', id);
  };

  const handlePublish = (id: string) => {
    toast.promise(publishPost({ postId: id }), {
      loading: 'Publishing post...',
      success: 'Post published successfully',
      error: 'Failed to publish post',
    });
  };

  const renderActionItems = () => {
    const items = [];

    switch (postStatus) {
      case 'SAVED':
        items.push(
          <DropdownMenuItem key="edit" onClick={() => handleEdit(postId)}>
            Edit
          </DropdownMenuItem>,
          <DropdownMenuItem key="publish" onClick={() => handlePublish(postId)}>
            Publish now
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
      <Card className="group relative">
        <div className="p-4">
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
                  {new Date(post.scheduledAt as Date).toLocaleDateString()}
                </div>
              )}

              {/* Social Icons - flex-shrink-0 */}
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {post.socialProviders.map((provider) => {
                  const Icon =
                    socialIcons[
                      provider.socialType as keyof typeof socialIcons
                    ];
                  return Icon ? (
                    <Icon
                      key={provider.profileId as string}
                      className={`h-4 w-4 ${provider.isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
                      title={
                        (provider.username || provider.socialType) as string
                      }
                    />
                  ) : null;
                })}
              </div>

              {/* Actions - flex-shrink-0 */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <ActionButtons />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Media Preview for Grid */}
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
                      muted
                      loop
                      playsInline
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
                </div>
              )}

              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <Badge variant={statusColors[postStatus]}>{postStatus}</Badge>
                <ActionButtons />
              </div>

              {/* Content */}
              <div className="min-w-0">
                <p className="line-clamp-3 text-sm">
                  {firstContent?.text ?? '...'}
                </p>
              </div>

              {/* Schedule Info & Social Providers */}
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                {post.scheduledAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.scheduledAt as Date).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {post.socialProviders.map((provider) => {
                    const Icon =
                      socialIcons[
                        provider.socialType as keyof typeof socialIcons
                      ];
                    return Icon ? (
                      <Tooltip key={provider.profileId as string}>
                        <TooltipTrigger>
                          <Icon
                            className={`h-4 w-4 ${provider.isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
                            title={
                              (provider.username ||
                                provider.socialType) as string
                            }
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {provider.fullName ?? provider.username}
                        </TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
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
