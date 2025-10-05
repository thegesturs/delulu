'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload, VideoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { cn } from '@delulu/design-system/lib/utils';
import {
  extractVideoFrame,
  generateThumbnailPreviews,
  formatTimestamp,
  blobToFile,
  type VideoFrameResult,
} from '@/lib/video-frames';
import { useMediaStorage } from '@/hooks/use-media-storage';
import { getMediaUrlFromObject } from '@/lib/media-url';

interface VideoThumbnailSelectorProps {
  videoUrl: string;
  videoFile?: File;
  currentThumbnail?: {
    url?: string;
    bucketKey?: string;
    bucketUrl?: string;
  };
  onThumbnailUpdate: (thumbnail: {
    bucketKey: string;
    url: string;
    thumbnailBucketUrl?: string;
    thumbnailBucketKey?: string;
  }) => void;
  isOpen: boolean;
  onClose: () => void;
  isVertical?: boolean; // Whether video is vertical (9:16) or horizontal (16:9)
}

export function VideoThumbnailSelector({
  videoUrl,
  videoFile,
  currentThumbnail,
  onThumbnailUpdate,
  isOpen,
  onClose,
  isVertical = true, // Default to vertical for shorts/reels/tiktok
}: VideoThumbnailSelectorProps) {
  const [selectedFrame, setSelectedFrame] = useState<VideoFrameResult | null>(
    null
  );
  const [thumbnailPreviews, setThumbnailPreviews] = useState<
    VideoFrameResult[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndSaveMedia } = useMediaStorage();

  // Get the video source (prefer videoFile for local files)
  const videoSource = videoFile || videoUrl;

  // Generate thumbnail previews on mount
  useEffect(() => {
    const generatePreviews = async () => {
      if (!videoSource) return;

      setIsGenerating(true);
      try {
        const previews = await generateThumbnailPreviews(videoSource, 6);
        setThumbnailPreviews(previews);

        // Set first preview as default if no thumbnail exists
        if (!currentThumbnail && previews.length > 0) {
          setSelectedFrame(previews[0]);
        }
      } catch (error) {
        console.error('Failed to generate thumbnail previews:', error);
        toast.error('Failed to generate thumbnail previews');
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreviews();
  }, [videoSource, currentThumbnail]);

  // Extract frame at current video time
  const handleExtractCurrentFrame = useCallback(async () => {
    if (!videoRef.current || !videoSource) return;

    try {
      const currentTime = videoRef.current.currentTime;
      const frame = await extractVideoFrame(videoSource, currentTime);
      setSelectedFrame(frame);
      setCustomThumbnail(null); // Clear custom thumbnail when selecting from video
      toast.success(`Frame captured at ${formatTimestamp(currentTime)}`);
    } catch (error) {
      console.error('Failed to extract frame:', error);
      toast.error('Failed to extract frame');
    }
  }, [videoSource]);

  // Handle custom thumbnail upload
  const handleCustomThumbnail = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomThumbnail(dataUrl);
        setSelectedFrame(null); // Clear video frame when uploading custom
        toast.success('Custom thumbnail uploaded');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Upload selected thumbnail
  const handleUploadThumbnail = useCallback(async () => {
    let thumbnailToUpload: File | null = null;

    if (customThumbnail) {
      // Convert custom thumbnail data URL to file
      const response = await fetch(customThumbnail);
      const blob = await response.blob();
      thumbnailToUpload = blobToFile(blob, `thumbnail-${Date.now()}.jpg`);
    } else if (selectedFrame) {
      // Use selected video frame
      thumbnailToUpload = blobToFile(
        selectedFrame.blob,
        `thumbnail-${Date.now()}.jpg`
      );
    }

    if (!thumbnailToUpload) {
      toast.error('No thumbnail selected');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadAndSaveMedia(thumbnailToUpload);

      onThumbnailUpdate({
        bucketKey: result.bucketKey,
        url: result.url,
        thumbnailBucketUrl: result.url,
        thumbnailBucketKey: result.bucketKey,
      });

      toast.success('Thumbnail uploaded successfully');
      onClose(); // Close dialog after successful upload
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setIsUploading(false);
    }
  }, [
    customThumbnail,
    selectedFrame,
    uploadAndSaveMedia,
    onThumbnailUpdate,
    onClose,
  ]);

  const displayThumbnail = customThumbnail || selectedFrame?.dataUrl;
  const hasThumbnail = currentThumbnail?.url || currentThumbnail?.bucketKey;
  const videoAspectClass = isVertical ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Video Thumbnail</DialogTitle>
          <DialogDescription>
            Choose a frame from your video or upload a custom thumbnail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div
            className={cn(
              'relative mx-auto max-w-md overflow-hidden rounded-lg bg-black',
              videoAspectClass
            )}
          >
            <video
              ref={videoRef}
              src={getMediaUrlFromObject({
                url: videoUrl,
                bucketKey: undefined,
              })}
              className="h-full w-full object-contain"
              controls
              playsInline
            >
              <track kind="captions" />
            </video>
          </div>

          {/* Extract Frame Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleExtractCurrentFrame}
            className="w-full"
            disabled={!videoSource}
          >
            <VideoIcon className="mr-2 h-4 w-4" />
            Capture Current Frame as Thumbnail
          </Button>

          {/* Thumbnail Previews Grid */}
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            thumbnailPreviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  Or select from generated previews:
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {thumbnailPreviews.map((preview, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedFrame(preview);
                        setCustomThumbnail(null);
                      }}
                      className={cn(
                        'group relative overflow-hidden rounded-lg border-2 transition-all',
                        isVertical ? 'aspect-[9/16]' : 'aspect-video',
                        selectedFrame === preview && !customThumbnail
                          ? 'border-primary'
                          : 'border-border hover:border-input'
                      )}
                    >
                      <img
                        src={preview.dataUrl}
                        alt={`Frame at ${formatTimestamp(preview.timestamp)}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1 py-0.5 text-white text-xs">
                        {formatTimestamp(preview.timestamp)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Custom Thumbnail Upload */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 border-border border-t" />
              <span className="px-2 text-muted-foreground text-xs">OR</span>
              <div className="flex-1 border-border border-t" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomThumbnail}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Custom Thumbnail
            </Button>
          </div>

          {/* Selected Thumbnail Preview */}
          {displayThumbnail && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">
                Selected thumbnail:
              </p>
              <div
                className={cn(
                  'relative mx-auto max-w-md overflow-hidden rounded-lg border border-border',
                  videoAspectClass
                )}
              >
                <img
                  src={displayThumbnail}
                  alt="Selected thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>

              <Button
                type="button"
                onClick={handleUploadThumbnail}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Save Thumbnail
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Current Thumbnail Display */}
          {hasThumbnail && !displayThumbnail && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">
                Current thumbnail:
              </p>
              <div
                className={cn(
                  'relative mx-auto max-w-md overflow-hidden rounded-lg border border-border',
                  videoAspectClass
                )}
              >
                <img
                  src={getMediaUrlFromObject({
                    url: currentThumbnail?.url,
                    bucketKey: currentThumbnail?.bucketKey,
                    bucketUrl: currentThumbnail?.bucketUrl,
                  })}
                  alt="Current thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
