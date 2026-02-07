"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@delulu/design-system/components/ui/dialog";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Image01Icon,
  Loading03Icon,
  Upload01Icon,
  VideoIcon,
} from "@hugeicons-pro/core-solid-rounded";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMediaStorage } from "@/hooks/use-media-storage";
import { getMediaUrlFromObject } from "@/lib/media-url";
import {
  blobToFile,
  extractVideoFrame,
  formatTimestamp,
  generateThumbnailPreviews,
  type VideoFrameResult,
} from "@/lib/video-frames";

interface VideoThumbnailSelectorProps {
  videoUrl: string;
  videoFile?: File;
  currentThumbnail?: {
    url?: string;
    bucketKey?: string;
    bucketUrl?: string;
    thumbnailTimestamp?: number; // Existing timestamp if set
  };
  onThumbnailUpdate: (thumbnail: {
    // For video frame selection: only thumbnailTimestamp (platforms extract the frame)
    // For custom image upload: thumbnailBucketUrl + thumbnailBucketKey
    thumbnailBucketUrl?: string;
    thumbnailBucketKey?: string;
    thumbnailTimestamp?: number; // Timestamp in seconds when video frame was extracted
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

  // Generate thumbnail previews when dialog opens
  useEffect(() => {
    // Only generate if dialog is open and we don't have previews yet
    if (!(isOpen && videoSource) || thumbnailPreviews.length > 0) {
      return;
    }

    const generatePreviews = async () => {
      setIsGenerating(true);
      try {
        const previews = await generateThumbnailPreviews(videoSource, 6);
        setThumbnailPreviews(previews);

        // Set first preview as default if no thumbnail exists
        if (!currentThumbnail && previews.length > 0) {
          setSelectedFrame(previews[0]);
        }
      } catch (error) {
        console.error("Failed to generate thumbnail previews:", error);
        // Only show error if dialog is still open
        if (isOpen) {
          toast.error("Failed to generate thumbnail previews");
        }
      } finally {
        setIsGenerating(false);
      }
    };

    // Add a small delay to ensure video element is ready
    const timeoutId = setTimeout(() => {
      generatePreviews();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isOpen, videoSource, currentThumbnail, thumbnailPreviews.length]);

  // Extract frame at current video time
  const handleExtractCurrentFrame = useCallback(async () => {
    if (!(videoRef.current && videoSource)) {
      return;
    }

    try {
      const currentTime = videoRef.current.currentTime;
      const frame = await extractVideoFrame(videoSource, currentTime);
      setSelectedFrame(frame);
      setCustomThumbnail(null); // Clear custom thumbnail when selecting from video
      toast.success(`Frame captured at ${formatTimestamp(currentTime)}`);
    } catch (error) {
      console.error("Failed to extract frame:", error);
      toast.error("Failed to extract frame");
    }
  }, [videoSource]);

  // Handle custom thumbnail upload
  const handleCustomThumbnail = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomThumbnail(dataUrl);
        setSelectedFrame(null); // Clear video frame when uploading custom
        toast.success("Custom thumbnail uploaded");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Save selected thumbnail
  // For video frames: only save timestamp (TikTok/Instagram extract the frame themselves)
  // For custom images: upload to S3 and save URL (for Instagram's cover_url)
  const handleSaveThumbnail = useCallback(async () => {
    if (customThumbnail) {
      // Custom image - needs upload for Instagram's cover_url feature
      setIsUploading(true);
      try {
        const response = await fetch(customThumbnail);
        const blob = await response.blob();
        const thumbnailToUpload = blobToFile(
          blob,
          `thumbnail-${Date.now()}.jpg`
        );
        const result = await uploadAndSaveMedia(thumbnailToUpload);

        onThumbnailUpdate({
          thumbnailBucketUrl: result.url,
          thumbnailBucketKey: result.bucketKey,
          // No timestamp for custom images
        });

        toast.success("Custom thumbnail uploaded");
        onClose();
      } catch (error) {
        console.error("Failed to upload custom thumbnail:", error);
        toast.error("Failed to upload thumbnail");
      } finally {
        setIsUploading(false);
      }
    } else if (selectedFrame) {
      // Video frame - just save timestamp, no upload needed
      // TikTok uses video_cover_timestamp_ms, Instagram uses thumb_offset
      onThumbnailUpdate({
        thumbnailTimestamp: selectedFrame.timestamp,
      });

      toast.success(
        `Thumbnail set to ${formatTimestamp(selectedFrame.timestamp)}`
      );
      onClose();
    } else {
      toast.error("No thumbnail selected");
    }
  }, [
    customThumbnail,
    selectedFrame,
    uploadAndSaveMedia,
    onThumbnailUpdate,
    onClose,
  ]);

  const displayThumbnail = customThumbnail || selectedFrame?.dataUrl;
  const hasCustomImage = currentThumbnail?.url || currentThumbnail?.bucketKey;
  const hasTimestamp = currentThumbnail?.thumbnailTimestamp !== undefined;
  const hasThumbnail = hasCustomImage || hasTimestamp;
  const videoAspectClass = isVertical ? "aspect-[9/16]" : "aspect-video";

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[calc(100%-5rem)]">
        <DialogHeader>
          <DialogTitle>Select Video Thumbnail</DialogTitle>
          <DialogDescription>
            Choose a frame from your video or upload a custom thumbnail
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(200px,320px)_1fr]">
          {/* Left Column - Video Player (Fixed size on larger screens) */}
          <div className="space-y-3">
            <div
              className={cn(
                "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg bg-black md:max-w-none",
                videoAspectClass
              )}
            >
              <video
                className="h-full w-full object-contain"
                controls
                playsInline
                ref={videoRef}
                src={getMediaUrlFromObject({
                  url: videoUrl,
                  bucketKey: undefined,
                })}
              >
                <track kind="captions" />
              </video>
            </div>

            {/* Extract Frame Button */}
            <Button
              className="w-full"
              disabled={!videoSource}
              onClick={handleExtractCurrentFrame}
              type="button"
              variant="outline"
            >
              <Icon className="mr-2" icon={VideoIcon} size={16} />
              Capture Current Frame
            </Button>
          </div>

          {/* Right Column - Thumbnail Options */}
          <div className="space-y-4">
            {/* Thumbnail Previews Grid */}
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <Icon
                  className="animate-spin text-muted-foreground"
                  icon={Loading03Icon}
                  size={24}
                />
              </div>
            ) : (
              thumbnailPreviews.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium text-sm">
                    Select from generated previews:
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {thumbnailPreviews.map((preview, index) => (
                      <button
                        className={cn(
                          "group relative overflow-hidden rounded-lg border-2 transition-all hover:scale-105",
                          isVertical ? "aspect-[9/16]" : "aspect-video",
                          selectedFrame === preview && !customThumbnail
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-input"
                        )}
                        key={index}
                        onClick={() => {
                          setSelectedFrame(preview);
                          setCustomThumbnail(null);
                        }}
                        type="button"
                      >
                        <img
                          alt={`Frame at ${formatTimestamp(preview.timestamp)}`}
                          className="h-full w-full object-cover"
                          src={preview.dataUrl}
                        />
                        <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1.5 py-0.5 text-white text-xs">
                          {formatTimestamp(preview.timestamp)}
                        </div>
                        {selectedFrame === preview && !customThumbnail && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <div className="rounded-full bg-primary p-1">
                              <Icon
                                className="text-primary-foreground"
                                icon={Image01Icon}
                                size={12}
                              />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Custom Thumbnail Upload */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex-1 border-border border-t" />
                <span className="px-2 text-muted-foreground text-xs">OR</span>
                <div className="flex-1 border-border border-t" />
              </div>

              <input
                accept="image/*"
                className="hidden"
                onChange={handleCustomThumbnail}
                ref={fileInputRef}
                type="file"
              />

              <Button
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                type="button"
                variant="outline"
              >
                <Icon className="mr-2" icon={Upload01Icon} size={16} />
                Upload Custom Thumbnail
              </Button>
            </div>

            {/* Selected Thumbnail Preview */}
            {displayThumbnail && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <p className="font-medium text-sm">Selected thumbnail:</p>
                <div
                  className={cn(
                    "relative mx-auto max-w-[200px] overflow-hidden rounded-lg border-2 border-primary",
                    videoAspectClass
                  )}
                >
                  <img
                    alt="Selected thumbnail"
                    className="h-full w-full object-cover"
                    src={displayThumbnail}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={isUploading}
                  onClick={handleSaveThumbnail}
                  type="button"
                >
                  {isUploading ? (
                    <>
                      <Icon
                        className="mr-2 animate-spin"
                        icon={Loading03Icon}
                        size={16}
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icon className="mr-2" icon={Upload01Icon} size={16} />
                      Save Thumbnail
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Current Thumbnail Display */}
            {hasThumbnail && !displayThumbnail && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <p className="font-medium text-sm">Current thumbnail:</p>
                {hasCustomImage ? (
                  <div
                    className={cn(
                      "relative mx-auto max-w-[200px] overflow-hidden rounded-lg border border-border",
                      videoAspectClass
                    )}
                  >
                    <img
                      alt="Current thumbnail"
                      className="h-full w-full object-cover"
                      src={getMediaUrlFromObject({
                        url: currentThumbnail?.url,
                        bucketKey: currentThumbnail?.bucketKey,
                      })}
                    />
                  </div>
                ) : hasTimestamp ? (
                  <div className="flex items-center justify-center rounded-lg border border-border border-dashed bg-muted/30 p-6">
                    <p className="text-muted-foreground text-sm">
                      Frame at{" "}
                      <span className="font-medium text-foreground">
                        {formatTimestamp(currentThumbnail!.thumbnailTimestamp!)}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
