'use client';

import { useQuery } from 'convex/react';
import { Icon } from '@delulu/design-system/providers/icon';
import { Image01Icon, Search01Icon, VideoIcon } from '@hugeicons-pro/core-solid-rounded';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  canAddMediaType,
  getDynamicMediaLimits,
  getMediaCountInstruction,
} from '@/lib/platform-rules';
import { getMediaUrl } from '@/lib/media-url';
import { api } from '@delulu/database/convex/_generated/api';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { Input } from '@delulu/design-system/components/ui/input';
import { cn } from '@delulu/design-system/lib/utils';
import type { SocialType } from '@delulu/validators/post';

interface MediaItem {
  id: string;
  url: string;
  bucketKey: string;
  mediaType: 'IMAGE' | 'VIDEO';
  originalFilename?: string | null;
  size?: number | null;
  extension?: string | null;
  altText?: string | null;
  createdAt: string | Date;
}

interface MediaSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem[]) => void;
  socialType: SocialType;
  currentMedia: MediaItem[];
}

interface MediaGridProps {
  filteredMedia: MediaItem[];
  selectedMedia: MediaItem[];
  canSelectImages: boolean;
  canSelectVideos: boolean;
  onMediaSelect: (media: MediaItem) => void;
  onScrollEnd: () => void;
}

function MediaGrid({
  filteredMedia,
  selectedMedia,
  canSelectImages,
  canSelectVideos,
  onMediaSelect,
  onScrollEnd,
}: MediaGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll detection for infinite scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Trigger load more when scrolled to 80%
    if (scrollPercentage > 0.8) {
      onScrollEnd();
    }
  }, [onScrollEnd]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredMedia.map((media) => {
          const isSelected = selectedMedia.some((m) => m.id === media.id);
          const canSelect =
            !isSelected &&
            ((media.mediaType === 'IMAGE' && canSelectImages) ||
              (media.mediaType === 'VIDEO' && canSelectVideos));

          const mediaUrl = getMediaUrl(media.bucketKey, media.url);

          return (
            <motion.div
              key={media.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted',
                {
                  'cursor-pointer border-primary': isSelected,
                  'cursor-pointer border-border hover:border-input':
                    canSelect && !isSelected,
                  'cursor-not-allowed border-border opacity-50':
                    !canSelect && !isSelected,
                }
              )}
              onClick={() => (isSelected || canSelect) && onMediaSelect(media)}
              onMouseEnter={(e) => {
                if (media.mediaType === 'VIDEO') {
                  const video = e.currentTarget.querySelector('video');
                  if (video) {
                    video.play().catch(() => {
                      // Ignore play errors
                    });
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (media.mediaType === 'VIDEO') {
                  const video = e.currentTarget.querySelector('video');
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }
              }}
            >
              {media.mediaType === 'IMAGE' ? (
                <Image
                  src={mediaUrl}
                  alt={media.altText || 'Media'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 200px"
                />
              ) : (
                <div className="relative h-full w-full">
                  <video
                    src={mediaUrl}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 transition-opacity group-hover:opacity-0">
                    <div className="rounded-full bg-black bg-opacity-50 p-2">
                      <Icon icon={VideoIcon} size={16} className="text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                  <svg
                    className="h-3 w-3 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Media type indicator */}
              <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5">
                {media.mediaType === 'IMAGE' ? (
                  <Icon icon={Image01Icon} size={12} />
                ) : (
                  <Icon icon={VideoIcon} size={12} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function MediaSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  socialType,
  currentMedia,
}: MediaSelectionDialogProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursor, setCursor] = useState<number | null>(null);
  const [accumulatedMedia, setAccumulatedMedia] = useState<MediaItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get dynamic media limits based on current state
  const limits = getDynamicMediaLimits(socialType, currentMedia);
  const { canAddImages, canAddVideos, remainingImages, remainingVideos } =
    limits;

  // Use standard Convex query with cursor-based pagination
  const mediaQuery = useQuery(
    api.media.getMedia,
    isOpen
      ? {
          limit: 50,
          cursor: cursor ?? undefined,
        }
      : 'skip'
  );

  const isLoading = mediaQuery === undefined;

  // Extract data from new response format
  const currentPageMedia = mediaQuery?.media || [];
  const nextCursor = mediaQuery?.nextCursor ?? null;
  const hasMore = mediaQuery?.hasMore ?? false;

  // Transform and accumulate media on new data
  useEffect(() => {
    if (currentPageMedia.length > 0) {
      const newMedia: MediaItem[] = currentPageMedia.map((item) => ({
        id: item._id as string,
        url: item.url,
        bucketKey: item.bucketKey,
        mediaType: item.mediaType,
        originalFilename: item.originalFilename,
        size: item.size,
        extension: item.extension,
        altText: item.altText,
        createdAt: new Date(item.createdAt).toISOString(),
      }));

      setAccumulatedMedia((prev) => {
        // If cursor is null, this is the first page - replace
        if (!cursor) {
          return newMedia;
        }
        // Otherwise append new media
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNew = newMedia.filter((m) => !existingIds.has(m.id));
        return [...prev, ...uniqueNew];
      });

      setIsLoadingMore(false);
    }
  }, [currentPageMedia, cursor]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && nextCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      setCursor(nextCursor);
    }
  }, [hasMore, nextCursor, isLoadingMore]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMedia([]);
      setCursor(null);
      setAccumulatedMedia([]);
      setIsLoadingMore(false);
    }
  }, [isOpen]);

  // Use accumulated media as the source
  const allMedia = accumulatedMedia;

  // Filter media based on platform constraints
  const filteredMedia = allMedia.filter((media) => {
    // Filter by what can still be added
    if (media.mediaType === 'IMAGE' && !canAddImages) {
      return false;
    }
    if (media.mediaType === 'VIDEO' && !canAddVideos) {
      return false;
    }

    return true;
  });

  // Validate if a specific media item can be selected
  const canSelectMedia = (media: MediaItem): boolean => {
    // If already selected, allow deselection
    if (selectedMedia.some((m) => m.id === media.id)) {
      return true;
    }

    // Use centralized validation with current + selected media
    const allCurrentMedia = [...currentMedia, ...selectedMedia];
    const validation = canAddMediaType(
      socialType,
      media.mediaType,
      allCurrentMedia
    );
    return validation.canAdd;
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === media.id);

      // Allow deselection
      if (isSelected) {
        return prev.filter((m) => m.id !== media.id);
      }

      // Check if we can select this media
      if (!canSelectMedia(media)) {
        return prev;
      }

      return [...prev, media];
    });
  };

  const handleConfirm = () => {
    onSelect(selectedMedia);
    onClose();
  };

  // Calculate max selection info
  const maxSelectable = remainingImages + remainingVideos;

  // Get constraint message using centralized utility
  const getConstraintMessage = () => {
    const instruction = getMediaCountInstruction(socialType, currentMedia);

    if (selectedMedia.length > 0) {
      // Show what will be available after current selection
      const futureMedia = [...currentMedia, ...selectedMedia];
      const futureLimits = getDynamicMediaLimits(socialType, futureMedia);
      return `${instruction} → After selection: ${futureLimits.remainingImages} image(s), ${futureLimits.remainingVideos} video(s) remaining`;
    }

    return instruction;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-6xl">
        <DialogHeader>
          <DialogTitle>Select from Your Media Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Icon icon={Search01Icon} size={16} className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Constraint message */}
          <div className="rounded bg-muted/50 p-2 text-muted-foreground text-sm">
            {getConstraintMessage()}
          </div>

          {/* Media Grid with Virtual Scrolling */}
          <div className="h-96 overflow-y-auto">
            {isLoading && accumulatedMedia.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading media...</p>
                </div>
              </div>
            )}
            {!isLoading && filteredMedia.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Icon icon={Image01Icon} size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No media found</p>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Upload some media first'}
                  </p>
                </div>
              </div>
            )}
            {filteredMedia.length > 0 && (
              <>
                <MediaGrid
                  filteredMedia={filteredMedia}
                  selectedMedia={selectedMedia}
                  canSelectImages={canAddImages}
                  canSelectVideos={canAddVideos}
                  onMediaSelect={handleMediaSelect}
                  onScrollEnd={loadMore}
                />

                {/* Loading indicator for pagination */}
                {isLoadingMore && (
                  <div className="mt-4 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-muted-foreground text-sm">
                      Loading more...
                    </p>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMore && filteredMedia.length > 50 && (
                  <div className="mt-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      All media loaded ({filteredMedia.length} items)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground text-sm">
            {selectedMedia.length} of {maxSelectable} selected
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedMedia.length === 0}
            >
              Select ({selectedMedia.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
