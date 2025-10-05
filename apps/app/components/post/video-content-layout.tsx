'use client';

import { useCallback, useState } from 'react';
import { Card } from '@delulu/design-system/components/ui/card';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import { Input } from '@delulu/design-system/components/ui/input';
import { Label } from '@delulu/design-system/components/ui/label';
import { Button } from '@delulu/design-system/components/ui/button';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { cn } from '@delulu/design-system/lib/utils';
import type { SocialType } from '@delulu/validators/post';
import { SocialTypes } from '@delulu/validators/post';
import { ImageIcon, Edit3 } from 'lucide-react';
import { VideoThumbnailSelector } from './video-thumbnail-selector';
import { getMediaUrlFromObject } from '@/lib/media-url';

interface VideoMedia {
  mediaType: 'VIDEO';
  url?: string;
  bucketKey?: string;
  bucketUrl?: string;
  thumbnailBucketUrl?: string;
  thumbnailBucketKey?: string;
}

interface VideoContentLayoutProps {
  socialType: SocialType;
  videoMedia: VideoMedia;
  text: string;
  title?: string;
  onTextChange: (text: string) => void;
  onTitleChange?: (title: string) => void;
  onThumbnailUpdate: (thumbnail: {
    bucketKey: string;
    url: string;
    thumbnailBucketUrl?: string;
    thumbnailBucketKey?: string;
  }) => void;
}

function getPlatformConfig(socialType: SocialType) {
  switch (socialType) {
    case SocialTypes.TIKTOK:
      return {
        captionLabel: 'Caption',
        captionPlaceholder: 'Write a catchy caption for your TikTok...',
        maxLength: 2200,
        showTitle: false,
        showCharCount: true,
        requirements: 'Max 2,200 characters, vertical 9:16 video',
        isVertical: true,
      };
    case SocialTypes.YOUTUBE:
      return {
        captionLabel: 'Description',
        captionPlaceholder: 'Describe your video...',
        maxLength: 5000,
        showTitle: true,
        titlePlaceholder: 'YouTube Shorts title (max 100 characters)',
        titleMaxLength: 100,
        showCharCount: true,
        requirements: 'YouTube Shorts: 9:16 vertical video, max 60 seconds',
        isVertical: true,
      };
    case SocialTypes.THREADS:
      return {
        captionLabel: 'Post',
        captionPlaceholder: "What's on your mind?",
        maxLength: 500,
        showTitle: false,
        showCharCount: true,
        requirements: 'Max 500 characters',
        isVertical: false,
      };
    case SocialTypes.INSTAGRAM:
      return {
        captionLabel: 'Caption',
        captionPlaceholder: 'Write a caption for your Reel...',
        maxLength: 2200,
        showTitle: false,
        showCharCount: true,
        requirements: 'Instagram Reels: 9:16 vertical video, max 90 seconds',
        isVertical: true,
      };
    default:
      return {
        captionLabel: 'Caption',
        captionPlaceholder: 'Write a caption...',
        maxLength: undefined,
        showTitle: false,
        showCharCount: false,
        requirements: '',
        isVertical: false,
      };
  }
}

export function VideoContentLayout({
  socialType,
  videoMedia,
  text,
  title = '',
  onTextChange,
  onTitleChange,
  onThumbnailUpdate,
}: VideoContentLayoutProps) {
  const config = getPlatformConfig(socialType);
  const [isThumbnailDialogOpen, setIsThumbnailDialogOpen] = useState(false);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (config.maxLength && newText.length > config.maxLength) {
        return;
      }
      onTextChange(newText);
    },
    [config.maxLength, onTextChange]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      if (config.titleMaxLength && newTitle.length > config.titleMaxLength) {
        return;
      }
      onTitleChange?.(newTitle);
    },
    [config.titleMaxLength, onTitleChange]
  );

  const charsRemaining = config.maxLength ? config.maxLength - text.length : 0;
  const titleCharsRemaining = config.titleMaxLength
    ? config.titleMaxLength - title.length
    : 0;

  const videoUrl = getMediaUrlFromObject(videoMedia);
  const hasThumbnail =
    videoMedia.thumbnailBucketUrl || videoMedia.thumbnailBucketKey;

  const videoAspectClass = config.isVertical ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <Card className="mt-4 border-none p-4 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Video & Thumbnail */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Video Preview</Label>
              {hasThumbnail && (
                <Badge variant="secondary" className="gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Thumbnail set
                </Badge>
              )}
            </div>
            <div
              className={cn(
                'group relative mx-auto max-w-sm overflow-hidden rounded-lg bg-black',
                videoAspectClass
              )}
            >
              <video
                src={videoUrl}
                className="h-full w-full object-contain"
                controls
                playsInline
              >
                <track kind="captions" />
              </video>

              {/* Thumbnail overlay button */}
              <button
                type="button"
                onClick={() => setIsThumbnailDialogOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100"
              >
                <div className="rounded-lg bg-background px-4 py-2 text-foreground shadow-lg">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {hasThumbnail ? 'Change Thumbnail' : 'Select Thumbnail'}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Thumbnail button below video */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsThumbnailDialogOpen(true)}
              className="w-full"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {hasThumbnail ? 'Change Thumbnail' : 'Select Thumbnail'}
            </Button>
          </div>
        </div>

        {/* Right Column - Text Content */}
        <div className="space-y-4">
          {/* Platform Requirements */}
          {config.requirements && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-muted-foreground text-xs">
                {config.requirements}
              </p>
            </div>
          )}

          {/* Title Input (YouTube) */}
          {config.showTitle && (
            <div className="space-y-2">
              <Label htmlFor="video-title" className="text-sm">
                Title {config.titleMaxLength && '*'}
              </Label>
              <div className="relative">
                <Input
                  id="video-title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder={config.titlePlaceholder}
                  className="pr-16"
                  required={config.titleMaxLength !== undefined}
                />
                {config.titleMaxLength && (
                  <div
                    className={cn(
                      'absolute top-1/2 right-3 -translate-y-1/2 text-xs',
                      titleCharsRemaining < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {titleCharsRemaining}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caption/Description Textarea */}
          <div className="space-y-2">
            <Label htmlFor="video-caption" className="text-sm">
              {config.captionLabel}
            </Label>
            <div className="relative">
              <Textarea
                id="video-caption"
                value={text}
                onChange={handleTextChange}
                placeholder={config.captionPlaceholder}
                className="min-h-[300px] resize-none border-border pr-16 shadow-none focus-visible:ring-1"
              />
              {config.showCharCount && config.maxLength && (
                <div
                  className={cn(
                    'absolute top-2 right-2 text-xs',
                    charsRemaining < 0
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {charsRemaining}
                </div>
              )}
            </div>
          </div>

          {/* Character count info */}
          {config.showCharCount && config.maxLength && (
            <p className="text-muted-foreground text-xs">
              {text.length} / {config.maxLength} characters
            </p>
          )}
        </div>
      </div>

      {/* Thumbnail Selector Dialog */}
      <VideoThumbnailSelector
        videoUrl={videoUrl}
        currentThumbnail={{
          url: videoMedia.thumbnailBucketUrl,
          bucketKey: videoMedia.thumbnailBucketKey,
        }}
        onThumbnailUpdate={onThumbnailUpdate}
        isOpen={isThumbnailDialogOpen}
        onClose={() => setIsThumbnailDialogOpen(false)}
        isVertical={config.isVertical}
      />
    </Card>
  );
}
