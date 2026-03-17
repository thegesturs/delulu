"use client";

import { useAnalytics } from "@delulu/analytics/posthog/client";
import { MEDIA_UPLOADED } from "@delulu/analytics/events";
import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import type { SocialType } from "@delulu/validators/post";
import { SocialTypes } from "@delulu/validators/post";
import {
  Add01Icon,
  Cancel01Icon,
  FolderOpen,
  Image01Icon,
  Upload01Icon,
  VideoIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useMediaStorage } from "@/hooks/use-media-storage";
import { useMediaUrl } from "@/hooks/use-media-url";
import {
  canAddMediaType,
  canUploadMore as canUploadMoreUtil,
  getDynamicMediaLimits,
  validateTikTokVideo,
} from "@/lib/platform-rules";
import { useStore } from "@/store/post";
import { MediaSelectionDialog } from "./media-selection-dialog";

interface MediaFile {
  id: string;
  file?: File;
  mediaType: "IMAGE" | "VIDEO";
  previewUrl: string;
  bucketKey?: string;
  url?: string;
  size?: number;
  extension?: string;
  originalFilename?: string;
  isUploading?: boolean;
  altText?: string;
  bucketUrl?: string; // for backward compatibility
  thumbnailBucketUrl?: string;
  thumbnailBucketKey?: string;
}

interface MediaUploaderProps {
  socialType: SocialType;
  socialId: string;
  orderId?: number;
}

interface MediaPreviewProps {
  media: MediaFile;
  onRemove: (id: string) => void;
  getPreviewAspectRatio: (mediaType: "IMAGE" | "VIDEO") => string;
}

export function MediaPreview({
  media,
  onRemove,
  getPreviewAspectRatio,
}: MediaPreviewProps) {
  // Use presigned URL for saved media, fallback to previewUrl for local uploads
  const presignedUrl = useMediaUrl(media.bucketKey, media.url);
  const mediaUrl =
    media.bucketKey || media.url ? presignedUrl : media.previewUrl;

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-muted",
        getPreviewAspectRatio(media.mediaType)
      )}
      exit={{ opacity: 0, scale: 0.8 }}
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      {media.mediaType === "IMAGE" ? (
        <img
          alt="Preview"
          className="h-full w-full object-cover"
          src={mediaUrl}
        />
      ) : (
        <div className="relative h-full w-full">
          <video
            className="h-full w-full object-cover"
            controls
            muted
            playsInline
            src={mediaUrl}
          >
            <track kind="captions" />
          </video>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:hidden">
            <Icon className="text-white" icon={VideoIcon} size={24} />
          </div>
        </div>
      )}

      {media.isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex items-center space-x-2 text-white">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-sm">Uploading...</span>
          </div>
        </div>
      )}
      <motion.button
        animate={{ opacity: 1, scale: 1 }}
        aria-label="Remove media"
        className="absolute top-1 right-1 z-10 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity duration-200 hover:bg-destructive/90 group-hover:opacity-100"
        initial={{ opacity: 0, scale: 0.8 }}
        onClick={() => onRemove(media.id)}
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon icon={Cancel01Icon} size={12} />
      </motion.button>
      <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-foreground">
        {media.mediaType === "IMAGE" ? (
          <Icon icon={Image01Icon} size={12} />
        ) : (
          <Icon icon={VideoIcon} size={12} />
        )}
      </div>
    </motion.div>
  );
}

interface UploadZoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  acceptedMimeTypes: string[];
  instruction: string;
  platformHint: string;
  multiple: boolean;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  socialType: SocialType;
}

function UploadZone({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  acceptedMimeTypes,
  instruction,
  platformHint,
  multiple,
  onFileInput,
  socialType,
}: UploadZoneProps) {
  // Determine if this platform requires media
  const requiresVideo =
    socialType === SocialTypes.TIKTOK || socialType === SocialTypes.YOUTUBE;
  const requiresEither = socialType === SocialTypes.INSTAGRAM;

  // Convert acceptedMimeTypes array to accept attribute string
  const acceptString = acceptedMimeTypes.join(",");

  return (
    <motion.div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-6 transition-colors",
        isDragOver
          ? "border-primary bg-primary/10"
          : "border-border hover:border-input"
      )}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={platformHint}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.01 }}
    >
      <input
        accept={acceptString}
        className="hidden"
        multiple={multiple}
        onChange={onFileInput}
        ref={fileInputRef}
        type="file"
      />
      <div className="text-center">
        <motion.div
          animate={{ y: isDragOver ? -5 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Icon
            className="mx-auto mb-2 text-muted-foreground"
            icon={Upload01Icon}
            size={32}
          />
        </motion.div>
        <p className="mb-1 text-muted-foreground text-sm">
          Drag and drop your media here, or{" "}
          <button
            className="font-medium text-primary hover:text-primary/80"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            browse
          </button>
        </p>
        <p className="text-muted-foreground text-xs">{instruction}</p>
        {(requiresVideo || requiresEither) && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2">
            <p className="text-foreground text-xs">
              {requiresVideo && "⚠️ "}
              {requiresEither && "ℹ️ "}
              {platformHint}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface MediaStatsProps {
  mediaFiles: MediaFile[];
  onClearAll: () => void;
  platformHint: string;
}

function MediaStats({ mediaFiles, onClearAll, platformHint }: MediaStatsProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-lg bg-muted p-2 text-muted-foreground text-xs"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="flex items-center space-x-3" title={platformHint}>
        <span className="flex items-center space-x-1">
          <Icon icon={Image01Icon} size={12} />
          <span>
            {mediaFiles.filter((f) => f.mediaType === "IMAGE").length} image(s)
          </span>
        </span>
        <span className="flex items-center space-x-1">
          <Icon icon={VideoIcon} size={12} />
          <span>
            {mediaFiles.filter((f) => f.mediaType === "VIDEO").length} video(s)
          </span>
        </span>
      </div>
      <Button
        className="h-auto px-2 py-1 text-xs"
        onClick={onClearAll}
        size="sm"
        type="button"
        variant="ghost"
      >
        Clear all
      </Button>
    </motion.div>
  );
}

export function MediaUploader({
  socialType,
  socialId,
  orderId,
}: MediaUploaderProps) {
  const { post, setPost, setIsMediaUploading } = useStore(
    useShallow((state) => ({
      post: state.post,
      setPost: state.setPost,
      setIsMediaUploading: state.setIsMediaUploading,
    }))
  );

  const { uploadAndSaveMedia } = useMediaStorage();
  const analytics = useAnalytics();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isUserAction = useRef(false);
  // Check if we're on the global/default tab by socialId, not socialType
  // socialType can be TIKTOK when on default tab if TikTok is the only platform
  const isGlobal = socialId === "global";

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    const content = isGlobal
      ? post.content.find((item) => item.order === orderId)
      : post.alternativeContent
          .find((item) => item.socialProvider.socialId === socialId)
          ?.content.find((item) => item.order === orderId);

    return (content?.media || [])
      .map((media) => ({
        id: crypto.randomUUID(),
        mediaType: media.mediaType,
        previewUrl: media.url || "",
        bucketKey: media.bucketKey,
        url: media.url,
        altText: media.altText,
        bucketUrl: media.bucketUrl,
        thumbnailBucketUrl: media.thumbnailBucketUrl,
        thumbnailBucketKey: media.thumbnailBucketKey,
        isUploading: false,
      }))
      .filter((m) => m.url || m.bucketKey);
  });

  // Update store only when mediaFiles change due to user actions
  useEffect(() => {
    if (isUserAction.current && orderId !== undefined) {
      const storeMedia = mediaFiles.map(
        ({
          mediaType,
          url,
          bucketKey,
          altText,
          bucketUrl,
          thumbnailBucketUrl,
          thumbnailBucketKey,
        }) => ({
          mediaType,
          url,
          bucketKey,
          altText,
          bucketUrl,
          thumbnailBucketUrl,
          thumbnailBucketKey,
        })
      );

      // Use functional update to always work with fresh state
      if (isGlobal) {
        setPost((currentPost) => ({
          ...currentPost,
          content: currentPost.content.map((item) =>
            item.order === orderId ? { ...item, media: storeMedia } : item
          ),
        }));
      } else {
        setPost((currentPost) => ({
          ...currentPost,
          alternativeContent: currentPost.alternativeContent.map((item) =>
            item.socialProvider.socialId === socialId
              ? {
                  ...item,
                  content: item.content.map((contentItem) =>
                    contentItem.order === orderId
                      ? { ...contentItem, media: storeMedia }
                      : contentItem
                  ),
                }
              : item
          ),
        }));
      }
      isUserAction.current = false;
    }
  }, [mediaFiles, setPost, socialId, isGlobal, orderId]);

  // Get dynamic media limits based on current state
  const limits = getDynamicMediaLimits(socialType, mediaFiles);
  const { acceptedMimeTypes, instruction, platformHint } = limits;

  const handleFileProcessing = useCallback(
    async (incomingFiles: File[]) => {
      let newMediaFiles: MediaFile[] = [];
      const validatedFiles: File[] = [];

      // Validate each file using centralized validation
      for (const file of incomingFiles) {
        const mediaType = file.type.startsWith("image/") ? "IMAGE" : "VIDEO";
        const validation = canAddMediaType(socialType, mediaType, [
          ...mediaFiles,
          ...validatedFiles.map((f) => ({
            mediaType: f.type.startsWith("image/")
              ? ("IMAGE" as const)
              : ("VIDEO" as const),
          })),
        ]);

        if (!validation.canAdd) {
          if (incomingFiles.length === 1) {
            // Only show error for single file uploads
            toast.error(validation.reason);
          }
          continue;
        }

        // TikTok video validation
        if (
          mediaType === "VIDEO" &&
          socialType === "TIKTOK" &&
          !mediaFiles.some((f) => f.mediaType === "VIDEO")
        ) {
          try {
            const videoValidation = await validateTikTokVideo(file);
            if (!videoValidation.isValid) {
              toast.error(
                `Video validation failed: ${videoValidation.errors.join(", ")}`
              );
              continue;
            }
            if (videoValidation.metadata) {
              const { duration, width, height } = videoValidation.metadata;
              toast.success(
                `Video validated: ${Math.floor(duration)}s, ${width}x${height}`
              );
            }
          } catch (error) {
            toast.error(
              `Video validation error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            continue;
          }
        }

        validatedFiles.push(file);
      }

      // Create initial media files with uploading state
      newMediaFiles = validatedFiles.map((file) => {
        const extension = file.name.split(".").pop() || "";
        return {
          id: crypto.randomUUID(),
          file,
          mediaType: file.type.startsWith("image/")
            ? ("IMAGE" as const)
            : ("VIDEO" as const),
          previewUrl: URL.createObjectURL(file),
          size: file.size,
          extension,
          isUploading: true,
        };
      });

      const updatedMediaFiles = [...mediaFiles, ...newMediaFiles];
      isUserAction.current = true;
      setMediaFiles(updatedMediaFiles);

      // Set upload state to true when starting uploads
      if (newMediaFiles.length > 0) {
        setIsMediaUploading(true);
      }

      // Upload files immediately
      try {
        const uploadPromises = newMediaFiles.map(async (mediaFile) => {
          if (!mediaFile.file) {
            return mediaFile;
          }

          try {
            const uploadResult = await uploadAndSaveMedia(mediaFile.file);

            // Update the media file with upload results
            setMediaFiles((prev) => {
              isUserAction.current = true; // Ensure store update happens
              return prev.map((item) =>
                item.id === mediaFile.id
                  ? {
                      ...item,
                      bucketKey: uploadResult.bucketKey,
                      url: uploadResult.url,
                      originalFilename: mediaFile.file?.name,
                      isUploading: false,
                      file: undefined, // Remove file after upload
                    }
                  : item
              );
            });

            return {
              ...mediaFile,
              bucketKey: uploadResult.bucketKey,
              url: uploadResult.url,
              originalFilename: mediaFile.file?.name,
              isUploading: false,
              file: undefined,
            };
          } catch (_error) {
            // Upload failed - error will be handled by removal from list

            // Remove failed upload from list
            setMediaFiles((prev) => {
              isUserAction.current = true; // Ensure store update happens
              return prev.filter((item) => item.id !== mediaFile.id);
            });

            return null;
          }
        });

        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(Boolean).length;
        if (successCount > 0) {
          analytics.capture(MEDIA_UPLOADED, {
            count: successCount,
            media_types: validatedFiles.map((f) =>
              f.type.startsWith("image/") ? "IMAGE" : "VIDEO"
            ),
            platform: socialType,
          });
        }
      } catch (_error) {
        // Upload process failed - individual errors already handled
      } finally {
        // Clear upload state when all uploads are done
        setIsMediaUploading(false);
      }
    },
    [mediaFiles, socialType, uploadAndSaveMedia, setIsMediaUploading, analytics]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      handleFileProcessing(files);
    },
    [handleFileProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFileProcessing(files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileProcessing]
  );

  const removeFile = useCallback((id: string) => {
    isUserAction.current = true;
    setMediaFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter((file) => file.id !== id);
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    mediaFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    isUserAction.current = true;
    setMediaFiles([]);
  }, [mediaFiles]);

  const handleSelectExistingMedia = useCallback(
    (
      selectedMedia: Array<{
        id: string;
        url: string;
        bucketKey: string;
        mediaType: "IMAGE" | "VIDEO";
        originalFilename?: string | null;
        size?: number | null;
        extension?: string | null;
        altText?: string | null;
        createdAt: string | Date;
      }>
    ) => {
      const newMediaFiles = selectedMedia.map((media) => ({
        id: crypto.randomUUID(),
        mediaType: media.mediaType,
        previewUrl: media.url,
        url: media.url,
        bucketKey: media.bucketKey,
        altText: media.altText || undefined,
        size: media.size || undefined,
        extension: media.extension || undefined,
        originalFilename: media.originalFilename || undefined,
        isUploading: false,
      }));

      isUserAction.current = true;
      setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    },
    []
  );

  const getAddButtonAspectRatio = () => {
    if (
      socialType === "TIKTOK" ||
      socialType === "YOUTUBE" ||
      socialType === "INSTAGRAM"
    ) {
      const hasVideo = mediaFiles.some((f) => f.mediaType === "VIDEO");
      const hasImage = mediaFiles.some((f) => f.mediaType === "IMAGE");
      if (!(hasVideo || hasImage)) {
        return "aspect-[9/16]";
      }
      if (!hasVideo) {
        return "aspect-[9/16]"; // Vertical for video platforms
      }
      if (!hasImage) {
        return "aspect-square"; // Square for thumbnail
      }
    }
    return "aspect-square";
  };

  const getPreviewAspectRatio = (mediaType: "IMAGE" | "VIDEO") => {
    if (
      socialType === "TIKTOK" ||
      socialType === "YOUTUBE" ||
      socialType === "INSTAGRAM"
    ) {
      if (mediaType === "VIDEO") {
        return "aspect-[9/16]"; // Vertical video
      }
      return "aspect-square"; // Square thumbnail
    }
    return "aspect-square";
  };

  // Check if more media can be uploaded using centralized utility
  const canUploadMore = canUploadMoreUtil(socialType, mediaFiles);

  return (
    <div className="space-y-4">
      {canUploadMore && (
        <>
          <UploadZone
            acceptedMimeTypes={acceptedMimeTypes}
            fileInputRef={fileInputRef}
            instruction={instruction}
            isDragOver={isDragOver}
            multiple={
              !(
                socialType === "TIKTOK" ||
                socialType === "YOUTUBE" ||
                (socialType === "INSTAGRAM" &&
                  mediaFiles.some((f) => f.mediaType === "VIDEO")) ||
                mediaFiles.some((f) => f.mediaType === "VIDEO")
              )
            }
            onDragLeave={() => setIsDragOver(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDrop={handleDrop}
            onFileInput={handleFileInput}
            platformHint={platformHint}
            socialType={socialType}
          />

          <div className="flex items-center space-x-2">
            <div className="flex-1 border-border border-t" />
            <span className="px-2 text-muted-foreground text-xs">OR</span>
            <div className="flex-1 border-border border-t" />
          </div>

          <Button
            className="w-full"
            onClick={() => setIsDialogOpen(true)}
            type="button"
            variant="outline"
          >
            <Icon className="mr-2" icon={FolderOpen} size={16} />
            Select from existing media
          </Button>
        </>
      )}

      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              {mediaFiles.map((media) => (
                <MediaPreview
                  getPreviewAspectRatio={getPreviewAspectRatio}
                  key={media.id}
                  media={media}
                  onRemove={removeFile}
                />
              ))}
            </AnimatePresence>

            {canUploadMore && mediaFiles.length > 0 && (
              <motion.button
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex items-center justify-center rounded-lg border-2 border-border border-dashed bg-muted/50 transition-colors hover:border-input hover:bg-muted",
                  getAddButtonAspectRatio()
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                onClick={() => fileInputRef.current?.click()}
                title={platformHint}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  className="text-muted-foreground"
                  icon={Add01Icon}
                  size={24}
                />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <MediaStats
            mediaFiles={mediaFiles}
            onClearAll={clearAllFiles}
            platformHint={platformHint}
          />
        )}
      </AnimatePresence>

      <MediaSelectionDialog
        currentMedia={mediaFiles.map((m) => ({
          id: m.id,
          url: m.url || m.previewUrl,
          bucketKey: m.bucketKey || "",
          mediaType: m.mediaType,
          originalFilename: m.originalFilename,
          size: m.size,
          extension: m.extension,
          altText: m.altText,
          createdAt: new Date().toISOString(),
        }))}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelectExistingMedia}
        socialType={socialType}
      />
    </div>
  );
}
