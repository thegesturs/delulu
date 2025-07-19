'use client';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';
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
  const router = useRouter();

  const softDeletePost = useMutation(api.posts.deletePost);
  const publishPost = useMutation(api.social_providers.createPostFromPostId);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);

  const statusColors = {
    SAVED: 'orange',
    SCHEDULED: 'amber',
    PUBLISHED: 'green',
    DELETED: 'red',
    FAILED: 'destructive',
  } as const;

  const postId = post._id as string;
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
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/post/${id}`);
  };

  const handleScheduleChange = (id: string) => {
    console.log('Change schedule for post:', id);
  };

  const handlePublish = async (id: string) => {
    setIsPublishing(true);
    try {
      await publishPost({ postId: id });
      toast.success('Your post is being published. It will be posted soon.');
      setShowPreview(false);
    } catch (error) {
      toast.error('Failed to publish post');
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
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
                  {new Date(post.scheduledAt).toLocaleDateString()}
                </div>
              )}

              {/* Social Icons - flex-shrink-0 */}
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {post.socialProviderIds.slice(0, 3).map((providerId, index) => (
                  <div
                    key={providerId}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs"
                    title={`Social account ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                ))}
                {post.socialProviderIds.length > 3 && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs">
                    +{post.socialProviderIds.length - 3}
                  </div>
                )}
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
                    {new Date(post.scheduledAt).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {post.socialProviderIds
                    .slice(0, 3)
                    .map((providerId, index) => (
                      <Tooltip key={providerId}>
                        <TooltipTrigger>
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs">
                            {index + 1}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Social account {index + 1}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  {post.socialProviderIds.length > 3 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs">
                          +{post.socialProviderIds.length - 3}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {post.socialProviderIds.length - 3} more accounts
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
