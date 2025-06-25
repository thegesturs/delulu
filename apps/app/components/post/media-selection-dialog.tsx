'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ImageIcon, Plus, Search, Upload, X } from 'lucide-react';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { Input } from '@delulu/design-system/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@delulu/design-system/components/ui/tabs';
import { cn } from '@delulu/design-system/lib/utils';

interface MediaItem {
  id: string;
  url: string;
  bucketKey: string;
  mediaType: 'IMAGE' | 'VIDEO';
  originalFilename?: string;
  size?: number;
  extension?: string;
  altText?: string;
  createdAt: string;
}

interface MediaSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem[]) => void;
  maxSelection?: number;
  mediaType?: 'IMAGE' | 'VIDEO' | 'ALL';
  multiple?: boolean;
}

export function MediaSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  maxSelection = 10,
  mediaType = 'ALL',
  multiple = true,
}: MediaSelectionDialogProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch existing media
  const fetchMedia = useCallback(async (page = 0, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: (page * 20).toString(),
      });
      
      if (mediaType !== 'ALL') {
        params.append('mediaType', mediaType);
      }

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const media: MediaItem[] = await response.json();
      
      if (append) {
        setExistingMedia(prev => [...prev, ...media]);
      } else {
        setExistingMedia(media);
      }
      
      setHasMore(media.length === 20);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mediaType]);

  // Load media when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchMedia(0, false);
      setSelectedMedia([]);
    }
  }, [isOpen, fetchMedia]);

  // Filter media based on search query
  const filteredMedia = existingMedia.filter(media =>
    !searchQuery || 
    media.originalFilename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    media.altText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMediaSelect = (media: MediaItem) => {
    if (!multiple) {
      setSelectedMedia([media]);
      return;
    }

    setSelectedMedia(prev => {
      const isSelected = prev.some(m => m.id === media.id);
      if (isSelected) {
        return prev.filter(m => m.id !== media.id);
      } else if (prev.length < maxSelection) {
        return [...prev, media];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    onSelect(selectedMedia);
    onClose();
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchMedia(currentPage + 1, true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Media</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Media Grid */}
            <div className="h-96 overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                {filteredMedia.map((media) => {
                  const isSelected = selectedMedia.some(m => m.id === media.id);
                  return (
                    <motion.div
                      key={media.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'relative cursor-pointer rounded-lg border-2 bg-muted overflow-hidden aspect-square',
                        isSelected ? 'border-primary' : 'border-border hover:border-input'
                      )}
                      onClick={() => handleMediaSelect(media)}
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
                              <svg
                                className="h-6 w-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
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
                        <ImageIcon className="h-3 w-3" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload functionality will be integrated here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For now, please close this dialog and use the regular upload area
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedMedia.length} of {maxSelection} selected
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