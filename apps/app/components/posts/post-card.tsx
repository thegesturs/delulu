'use client';

import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card } from '@delulu/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import { Calendar, Clock, Eye, MoreHorizontal, Pencil } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
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

  const statusColors = {
    SAVED: 'orange',
    SCHEDULED: 'amber',
    PUBLISHED: 'green',
    DELETED: 'red',
    FAILED: 'destructive',
  } as const;

  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete post:', id);
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', id);
  };

  const handleScheduleChange = (id: string) => {
    // TODO: Implement schedule change functionality
    console.log('Change schedule for post:', id);
  };

  const handlePublish = (id: string) => {
    // TODO: Implement publish functionality
    console.log('Publish post:', id);
  };

  const renderQuickActions = () => {
    switch (post.status) {
      case 'SAVED':
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePublish(post.id)}
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(post.id)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'SCHEDULED':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleScheduleChange(post.id)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Change Schedule
          </Button>
        );
      case 'PUBLISHED':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        );
      default:
        return null;
    }
  };

  const firstContent = post.content[0];
  const firstMedia = firstContent?.media?.[0];

  return (
    <>
      <Card
        className={`group relative ${layout === 'grid' ? 'w-[300px]' : 'w-full'}`}
      >
        <div className="space-y-4 p-4">
          {/* Media Preview - Only show in grid view */}
          {layout === 'grid' && firstMedia && (
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

          <div
            className={
              layout === 'list' ? 'flex items-center gap-6' : 'space-y-2'
            }
          >
            {/* Status and Actions */}
            <div
              className={
                layout === 'list'
                  ? 'flex min-w-[200px] items-center gap-4'
                  : 'flex items-center justify-between'
              }
            >
              <Badge variant={statusColors[post.status]}>{post.status}</Badge>
              {layout === 'grid' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${layout === 'list' ? 'line-clamp-1' : 'line-clamp-3'}`}
              >
                {firstContent?.text}
              </p>
            </div>

            {/* Schedule Info */}
            {post.scheduledAt && (
              <div
                className={`flex items-center gap-1 text-muted-foreground text-xs ${layout === 'list' ? 'min-w-[150px]' : ''}`}
              >
                <Calendar className="h-3 w-3" />
                {new Date(post.scheduledAt).toLocaleDateString()}
              </div>
            )}

            {/* Social Providers */}
            <div
              className={`flex items-center gap-2 ${layout === 'list' ? 'min-w-[100px]' : ''}`}
            >
              {post.socialProviders.map((provider) => {
                const Icon =
                  socialIcons[provider.socialType as keyof typeof socialIcons];
                return Icon ? (
                  <Icon
                    key={provider.profileId}
                    className={`h-4 w-4 ${provider.isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
                  />
                ) : null;
              })}
            </div>

            {/* Quick Actions */}
            {layout === 'list' && (
              <div className="flex items-center gap-2">
                {renderQuickActions()}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(post.id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPreview(true)}>
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </Card>

      <PostPreviewDialog
        post={post}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </>
  );
}
