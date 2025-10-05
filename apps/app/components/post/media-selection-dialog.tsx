'use client';

import { ImageIcon, Search, VideoIcon as Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

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
import { useQuery } from 'convex-helpers/react/cache';

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
  socialType: string;
  currentMedia: MediaItem[];
  maxImages: number;
  maxVideos: number;
}

interface MediaGridProps {
  filteredMedia: MediaItem[];
  selectedMedia: MediaItem[];
  canSelectImages: boolean;
  canSelectVideos: boolean;
  onMediaSelect: (media: MediaItem) => void;
}

function MediaGrid({
  filteredMedia,
  selectedMedia,
  canSelectImages,
  canSelectVideos,
  onMediaSelect,
}: MediaGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {filteredMedia.map((media) => {
        const isSelected = selectedMedia.some((m) => m.id === media.id);
        const canSelect =
          !isSelected &&
          ((media.mediaType === 'IMAGE' && canSelectImages) ||
            (media.mediaType === 'VIDEO' && canSelectVideos));

        return (
          <motion.div
            key={media.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg border-2 bg-muted',
              {
                'border-primary': isSelected,
                'cursor-pointer border-border hover:border-input':
                  canSelect && !isSelected,
                'cursor-not-allowed border-border opacity-50':
                  !canSelect && !isSelected,
              }
            )}
            onClick={() => canSelect && onMediaSelect(media)}
          >
            {media.mediaType === 'IMAGE' ? (
              <img
                src={media.url}
                alt={media.altText || 'Media'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative h-full w-full">
                <video
                  src={media.url}
                  className="h-full w-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <div className="rounded-full bg-black bg-opacity-50 p-2">
                    <Video className="h-4 w-4 text-white" />
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
                <ImageIcon className="h-3 w-3" />
              ) : (
                <Video className="h-3 w-3" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function MediaSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  socialType,
  currentMedia,
  maxImages,
  maxVideos,
}: MediaSelectionDialogProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate current counts
  const currentImageCount = currentMedia.filter(
    (m) => m.mediaType === 'IMAGE'
  ).length;
  const currentVideoCount = currentMedia.filter(
    (m) => m.mediaType === 'VIDEO'
  ).length;

  // Calculate what can still be selected
  const remainingImages = maxImages - currentImageCount;
  const remainingVideos = maxVideos - currentVideoCount;
  const canSelectImages = remainingImages > 0;
  const canSelectVideos = remainingVideos > 0;

  // Use Convex to fetch media - now with auto user fetching
  const hasSearch = searchQuery && searchQuery.trim().length > 0;

  // Use getMedia for browsing, searchMedia for searching
  const browseData = useQuery(
    api.media.getMedia,
    !isOpen || hasSearch ? 'skip' : { limit: 20, offset: 0 }
  );

  const searchData = useQuery(
    api.media.searchMedia,
    !isOpen || !hasSearch
      ? 'skip'
      : {
          searchTerm: searchQuery.trim(),
          limit: 50,
          offset: 0,
        }
  );

  const mediaData = hasSearch ? searchData : browseData;

  const isLoading = mediaData === undefined;

  // Transform Convex data to match MediaItem interface
  const allMedia: MediaItem[] = (mediaData || []).map((item) => ({
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

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMedia([]);
    }
  }, [isOpen]);

  // For now, no load more functionality (can be added later with pagination)
  const hasMore = false;

  // Filter media based on platform constraints and availability
  const filteredMedia = allMedia.filter((media) => {
    // Filter by what can still be selected
    if (media.mediaType === 'IMAGE' && !canSelectImages) {
      return false;
    }
    if (media.mediaType === 'VIDEO' && !canSelectVideos) {
      return false;
    }

    return true;
  });

  const canSelectImageMedia = (selectedImages: number): boolean => {
    // Check if we can select more images
    if (selectedImages + currentImageCount >= maxImages) {
      return false;
    }

    // Platform-specific constraints for images
    const hasVideos =
      currentVideoCount > 0 ||
      selectedMedia.some((m) => m.mediaType === 'VIDEO');
    const restrictedPlatforms = ['INSTAGRAM', 'TWITTER', 'LINKEDIN'];

    if (restrictedPlatforms.includes(socialType) && hasVideos) {
      return false;
    }

    return true;
  };

  const canSelectVideoMedia = (
    selectedVideos: number,
    selectedImages: number
  ): boolean => {
    // Check if we can select more videos
    if (selectedVideos + currentVideoCount >= maxVideos) {
      return false;
    }

    const hasImages = currentImageCount > 0 || selectedImages > 0;
    const restrictedPlatforms = ['INSTAGRAM', 'TWITTER', 'LINKEDIN'];
    const singleVideoPlatforms = ['TIKTOK', 'YOUTUBE'];

    // Platform-specific constraints for videos
    if (restrictedPlatforms.includes(socialType) && hasImages) {
      return false;
    }

    // TikTok/YouTube: Only 1 video allowed
    if (
      singleVideoPlatforms.includes(socialType) &&
      (currentVideoCount > 0 || selectedVideos > 0)
    ) {
      return false;
    }

    return true;
  };

  const canSelectMedia = (
    media: MediaItem,
    selectedMedia: MediaItem[]
  ): boolean => {
    const selectedImages = selectedMedia.filter(
      (m) => m.mediaType === 'IMAGE'
    ).length;
    const selectedVideos = selectedMedia.filter(
      (m) => m.mediaType === 'VIDEO'
    ).length;

    if (media.mediaType === 'IMAGE') {
      return canSelectImageMedia(selectedImages);
    }

    if (media.mediaType === 'VIDEO') {
      return canSelectVideoMedia(selectedVideos, selectedImages);
    }

    return true;
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === media.id);

      if (isSelected) {
        // Deselect media
        return prev.filter((m) => m.id !== media.id);
      }

      // Check if we can select this media
      if (!canSelectMedia(media, prev)) {
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
  const maxSelectable = Math.min(
    remainingImages + remainingVideos,
    socialType === 'TIKTOK' || socialType === 'YOUTUBE' ? 2 : 10
  );

  const getConstraintMessage = () => {
    if (socialType === 'TIKTOK' || socialType === 'YOUTUBE') {
      return `${remainingVideos} video(s) and ${remainingImages} thumbnail(s) remaining`;
    }
    if (
      socialType === 'INSTAGRAM' &&
      (currentVideoCount > 0 ||
        selectedMedia.some((m) => m.mediaType === 'VIDEO'))
    ) {
      return 'Only 1 video allowed (no images)';
    }
    if (
      socialType === 'INSTAGRAM' &&
      (currentImageCount > 0 ||
        selectedMedia.some((m) => m.mediaType === 'IMAGE'))
    ) {
      return `${remainingImages} image(s) remaining (no videos)`;
    }
    return `${remainingImages} image(s) or ${remainingVideos} video(s) remaining`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select from Your Media Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
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

          {/* Media Grid */}
          <div className="h-96 overflow-y-auto">
            {isLoading && (
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
                  <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No media found</p>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Upload some media first'}
                  </p>
                </div>
              </div>
            )}
            {!isLoading && filteredMedia.length > 0 && (
              <MediaGrid
                filteredMedia={filteredMedia}
                selectedMedia={selectedMedia}
                canSelectImages={canSelectImages}
                canSelectVideos={canSelectVideos}
                onMediaSelect={handleMediaSelect}
              />
            )}

            {/* Load more button - disabled for now */}
            {hasMore && (
              <div className="mt-4 text-center">
                <Button variant="outline" disabled={true}>
                  Load More
                </Button>
              </div>
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
