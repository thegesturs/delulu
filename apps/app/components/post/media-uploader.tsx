'use client';

import {
  FolderOpen,
  ImageIcon,
  Plus,
  Upload,
  VideoIcon as Video,
  XIcon as X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';

import { useMediaStorage } from '@/hooks/use-media-storage';
import { getMediaUrlFromObject } from '@/lib/media-url';
import { getMediaRequirementMessage } from '@/lib/platform-validation';
import { validateTikTokVideo } from '@/lib/video-validation';
import { useStore } from '@/store/post';
import { Button } from '@delulu/design-system/components/ui/button';
import { cn } from '@delulu/design-system/lib/utils';
import type { SocialType } from '@delulu/validators/post';
import { SocialTypes } from '@delulu/validators/post';
import { useShallow } from 'zustand/shallow';
import { MediaSelectionDialog } from './media-selection-dialog';

interface MediaFile {
  id: string;
  file?: File;
  mediaType: 'IMAGE' | 'VIDEO';
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

interface PlatformConfig {
  maxImages: number;
  maxVideos: number;
  acceptedFileTypes: string;
  uploadInstruction: string;
  countInstruction: string;
  aspectRatioInstruction: string;
  platformHint: string;
}

interface MediaPreviewProps {
  media: MediaFile;
  onRemove: (id: string) => void;
  getPreviewAspectRatio: (mediaType: 'IMAGE' | 'VIDEO') => string;
}

export function MediaPreview({
  media,
  onRemove,
  getPreviewAspectRatio,
}: MediaPreviewProps) {
  // Use environment-aware URL for saved media, fallback to previewUrl for local uploads
  const mediaUrl =
    media.bucketKey || media.url
      ? getMediaUrlFromObject(media)
      : media.previewUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-lg bg-muted',
        getPreviewAspectRatio(media.mediaType)
      )}
    >
      {media.mediaType === 'IMAGE' ? (
        <img
          src={mediaUrl}
          alt="Preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative h-full w-full">
          <video
            src={mediaUrl}
            className="h-full w-full object-cover"
            muted
            controls
            playsInline
          >
            <track kind="captions" />
          </video>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:hidden">
            <Video className="h-6 w-6 text-white" />
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
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(media.id)}
        className="absolute top-1 right-1 z-10 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity duration-200 hover:bg-destructive/90 group-hover:opacity-100"
        aria-label="Remove media"
      >
        <X className="h-3 w-3" />
      </motion.button>
      <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-foreground">
        {media.mediaType === 'IMAGE' ? (
          <ImageIcon className="h-3 w-3" />
        ) : (
          <Video className="h-3 w-3" />
        )}
      </div>
    </motion.div>
  );
}

function getPlatformConfig(
  socialType: SocialType,
  mediaFiles: MediaFile[]
): PlatformConfig {
  const currentImageCount = mediaFiles.filter(
    (f) => f.mediaType === 'IMAGE'
  ).length;
  const currentVideoCount = mediaFiles.filter(
    (f) => f.mediaType === 'VIDEO'
  ).length;

  let maxImages = socialType === 'INSTAGRAM' ? 10 : 4;
  let maxVideos = 1;
  let acceptedFileTypes = 'image/*,video/*';
  let uploadInstruction = 'Drag and drop your media here, or';
  let countInstruction = '';
  let aspectRatioInstruction = '';

  // Get platform requirement message from validation utility
  const platformHint = getMediaRequirementMessage(socialType);

  if (socialType === 'TIKTOK') {
    maxImages = 1;
    maxVideos = 1;
    acceptedFileTypes = 'video/mp4,video/quicktime,image/jpeg,image/png';
    uploadInstruction = 'Upload 1 vertical video (9:16) and 1 optional thumbnail';
    aspectRatioInstruction = 'Video: 9:16 vertical, Thumbnail: Square';
    if (mediaFiles.some((f) => f.mediaType === 'VIDEO')) {
      acceptedFileTypes = 'image/jpeg,image/png';
    } else if (mediaFiles.some((f) => f.mediaType === 'IMAGE')) {
      acceptedFileTypes = 'video/mp4,video/quicktime';
    }
    countInstruction = `${currentImageCount}/${maxImages} thumbnail, ${currentVideoCount}/${maxVideos} video.`;
  } else if (socialType === 'YOUTUBE') {
    maxImages = 1;
    maxVideos = 1;
    acceptedFileTypes = 'video/mp4,video/quicktime,image/jpeg,image/png';
    uploadInstruction = 'Upload 1 vertical video (9:16) for YouTube Shorts';
    aspectRatioInstruction = 'Video: 9:16 vertical, max 60 seconds';
    if (mediaFiles.some((f) => f.mediaType === 'VIDEO')) {
      acceptedFileTypes = 'image/jpeg,image/png';
    } else if (mediaFiles.some((f) => f.mediaType === 'IMAGE')) {
      acceptedFileTypes = 'video/mp4,video/quicktime';
    }
    countInstruction = `${currentImageCount}/${maxImages} thumbnail, ${currentVideoCount}/${maxVideos} video.`;
  } else if (socialType === 'INSTAGRAM') {
    if (mediaFiles.some((f) => f.mediaType === 'VIDEO')) {
      maxImages = 0;
      acceptedFileTypes = 'video/*';
      countInstruction = '1/1 Reel video (9:16 vertical). No images with video.';
      aspectRatioInstruction = 'Video: 9:16 vertical, max 90 seconds';
    } else if (
      mediaFiles.length > 0 &&
      mediaFiles.every((f) => f.mediaType === 'IMAGE')
    ) {
      maxVideos = 0;
      acceptedFileTypes = 'image/*';
      countInstruction = `${currentImageCount}/${maxImages} images. Max 1 Reel (no images).`;
    } else if (mediaFiles.length === 0) {
      acceptedFileTypes = 'image/*,video/*';
      countInstruction = `Up to ${maxImages} images OR 1 Reel (9:16 vertical).`;
    }
  } else {
    if (mediaFiles.some((f) => f.mediaType === 'VIDEO')) {
      maxImages = 0;
    } else if (mediaFiles.length >= maxImages && maxImages > 0) {
      maxVideos = 0;
    }
    countInstruction = `${currentImageCount}/${maxImages} images OR ${currentVideoCount}/${maxVideos} video.`;
  }

  return {
    maxImages,
    maxVideos,
    acceptedFileTypes,
    uploadInstruction,
    countInstruction,
    aspectRatioInstruction,
    platformHint,
  };
}

interface UploadZoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  acceptedFileTypes: string;
  uploadInstruction: string;
  countInstruction: string;
  aspectRatioInstruction: string;
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
  acceptedFileTypes,
  uploadInstruction,
  countInstruction,
  aspectRatioInstruction,
  platformHint,
  multiple,
  onFileInput,
  socialType,
}: UploadZoneProps) {
  // Determine if this platform requires media
  const requiresVideo =
    socialType === SocialTypes.TIKTOK || socialType === SocialTypes.YOUTUBE;
  const requiresEither = socialType === SocialTypes.INSTAGRAM;

  return (
    <motion.div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragOver
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-input'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      title={platformHint}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFileTypes}
        onChange={onFileInput}
        className="hidden"
      />
      <div className="text-center">
        <motion.div
          animate={{ y: isDragOver ? -5 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        </motion.div>
        <p className="mb-1 text-muted-foreground text-sm">
          {uploadInstruction}{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-primary hover:text-primary/80"
          >
            browse
          </button>
        </p>
        <p className="text-muted-foreground text-xs">{countInstruction}</p>
        {aspectRatioInstruction && (
          <p className="mt-1 text-muted-foreground text-xs">
            {aspectRatioInstruction}
          </p>
        )}
        {(requiresVideo || requiresEither) && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2">
            <p className="text-foreground text-xs">
              {requiresVideo && '⚠️ '}
              {requiresEither && 'ℹ️ '}
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between rounded-lg bg-muted p-2 text-muted-foreground text-xs"
    >
      <div className="flex items-center space-x-3" title={platformHint}>
        <span className="flex items-center space-x-1">
          <ImageIcon className="h-3 w-3" />
          <span>
            {mediaFiles.filter((f) => f.mediaType === 'IMAGE').length} image(s)
          </span>
        </span>
        <span className="flex items-center space-x-1">
          <Video className="h-3 w-3" />
          <span>
            {mediaFiles.filter((f) => f.mediaType === 'VIDEO').length} video(s)
          </span>
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-auto px-2 py-1 text-xs"
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

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isUserAction = useRef(false);
  const isGlobal = socialType === SocialTypes.DEFAULT;

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
        previewUrl: media.url || '',
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

      if (isGlobal) {
        setPost({
          ...post,
          content: post.content.map((item) =>
            item.order === orderId ? { ...item, media: storeMedia } : item
          ),
        });
      } else {
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.map((item) =>
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
        });
      }
      isUserAction.current = false;
    }
  }, [mediaFiles, post, setPost, socialId, isGlobal, orderId]);

  const platformConfig = getPlatformConfig(socialType, mediaFiles);
  const {
    maxImages,
    maxVideos,
    acceptedFileTypes,
    uploadInstruction,
    countInstruction,
    aspectRatioInstruction,
    platformHint,
  } = platformConfig;

  const handleFileProcessing = useCallback(
    async (incomingFiles: File[]) => {
      let filesToProcess = [...incomingFiles];
      const currentImages = mediaFiles.filter(
        (f) => f.mediaType === 'IMAGE'
      ).length;
      const currentVideos = mediaFiles.filter(
        (f) => f.mediaType === 'VIDEO'
      ).length;
      let newMediaFiles: MediaFile[] = [];

      if (socialType === 'TIKTOK' || socialType === 'YOUTUBE') {
        const hasVideo = mediaFiles.some((f) => f.mediaType === 'VIDEO');
        const hasImage = mediaFiles.some((f) => f.mediaType === 'IMAGE');

        // Filter and validate files for TikTok/YouTube
        const validatedFiles = [];

        for (const file of filesToProcess) {
          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');

          if (isVideo && !hasVideo && currentVideos < maxVideos) {
            if (socialType === 'TIKTOK') {
              // Validate TikTok video requirements
              try {
                const validation = await validateTikTokVideo(file);
                if (!validation.isValid) {
                  toast.error(
                    `Video validation failed: ${validation.errors.join(', ')}`
                  );
                  continue;
                }
                // Show success message with video details
                if (validation.metadata) {
                  const { duration, width, height } = validation.metadata;
                  toast.success(
                    `Video validated: ${Math.floor(duration)}s, ${width}x${height}`
                  );
                }
              } catch (error) {
                toast.error(
                  `Video validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
                continue;
              }
            }
            validatedFiles.push(file);
          } else if (isImage && !hasImage && currentImages < maxImages) {
            validatedFiles.push(file);
          }
        }

        filesToProcess = validatedFiles.slice(
          0,
          maxImages + maxVideos - (currentImages + currentVideos)
        );
      } else if (socialType === 'INSTAGRAM') {
        const hasVideo = mediaFiles.some((f) => f.mediaType === 'VIDEO');
        if (hasVideo) {
          filesToProcess = [];
        } else {
          const firstFileIsVideo = filesToProcess[0]?.type.startsWith('video/');
          if (
            firstFileIsVideo &&
            currentVideos < maxVideos &&
            currentImages === 0
          ) {
            filesToProcess = filesToProcess
              .slice(0, 1)
              .filter((f) => f.type.startsWith('video/'));
          } else if (!firstFileIsVideo && currentVideos === 0) {
            filesToProcess = filesToProcess
              .filter((f) => f.type.startsWith('image/'))
              .slice(0, maxImages - currentImages);
          } else {
            filesToProcess = [];
          }
        }
      } else {
        const hasVideo = mediaFiles.some((f) => f.mediaType === 'VIDEO');
        if (hasVideo) {
          filesToProcess = [];
        } else {
          const firstFileIsVideo = filesToProcess[0]?.type.startsWith('video/');
          if (
            firstFileIsVideo &&
            currentVideos < maxVideos &&
            currentImages === 0
          ) {
            filesToProcess = filesToProcess
              .slice(0, 1)
              .filter((f) => f.type.startsWith('video/'));
          } else if (!firstFileIsVideo && currentVideos === 0) {
            filesToProcess = filesToProcess
              .filter((f) => f.type.startsWith('image/'))
              .slice(0, maxImages - currentImages);
          } else {
            filesToProcess = [];
          }
        }
      }

      // Create initial media files with uploading state
      newMediaFiles = filesToProcess.map((file) => {
        const extension = file.name.split('.').pop() || '';
        return {
          id: crypto.randomUUID(),
          file,
          mediaType: file.type.startsWith('image/')
            ? ('IMAGE' as const)
            : ('VIDEO' as const),
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

        await Promise.all(uploadPromises);
      } catch (_error) {
        // Upload process failed - individual errors already handled
      } finally {
        // Clear upload state when all uploads are done
        setIsMediaUploading(false);
      }
    },
    [
      mediaFiles,
      socialType,
      maxImages,
      maxVideos,
      uploadAndSaveMedia,
      setIsMediaUploading,
    ]
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
        fileInputRef.current.value = '';
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
        mediaType: 'IMAGE' | 'VIDEO';
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
      socialType === 'TIKTOK' ||
      socialType === 'YOUTUBE' ||
      socialType === 'INSTAGRAM'
    ) {
      const hasVideo = mediaFiles.some((f) => f.mediaType === 'VIDEO');
      const hasImage = mediaFiles.some((f) => f.mediaType === 'IMAGE');
      if (!hasVideo && !hasImage) {
        return 'aspect-[9/16]';
      }
      if (!hasVideo) {
        return 'aspect-[9/16]'; // Vertical for video platforms
      }
      if (!hasImage) {
        return 'aspect-square'; // Square for thumbnail
      }
    }
    return 'aspect-square';
  };

  const getPreviewAspectRatio = (mediaType: 'IMAGE' | 'VIDEO') => {
    if (
      socialType === 'TIKTOK' ||
      socialType === 'YOUTUBE' ||
      socialType === 'INSTAGRAM'
    ) {
      if (mediaType === 'VIDEO') {
        return 'aspect-[9/16]'; // Vertical video
      }
      return 'aspect-square'; // Square thumbnail
    }
    return 'aspect-square';
  };

  const canUploadMore = (() => {
    const imageCount = mediaFiles.filter((f) => f.mediaType === 'IMAGE').length;
    const videoCount = mediaFiles.filter((f) => f.mediaType === 'VIDEO').length;

    if (socialType === 'TIKTOK' || socialType === 'YOUTUBE') {
      return imageCount < maxImages || videoCount < maxVideos;
    }
    if (socialType === 'INSTAGRAM') {
      if (videoCount > 0) {
        return false;
      }
      return imageCount < maxImages;
    }
    if (videoCount > 0) {
      return false;
    }
    return imageCount < maxImages;
  })();

  return (
    <div className="space-y-4">
      {canUploadMore && (
        <>
          <UploadZone
            isDragOver={isDragOver}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            fileInputRef={fileInputRef}
            acceptedFileTypes={acceptedFileTypes}
            uploadInstruction={uploadInstruction}
            countInstruction={countInstruction}
            aspectRatioInstruction={aspectRatioInstruction}
            platformHint={platformHint}
            multiple={
              !(
                socialType === 'TIKTOK' ||
                socialType === 'YOUTUBE' ||
                (socialType === 'INSTAGRAM' &&
                  mediaFiles.some((f) => f.mediaType === 'VIDEO')) ||
                mediaFiles.some((f) => f.mediaType === 'VIDEO')
              )
            }
            onFileInput={handleFileInput}
            socialType={socialType}
          />

          <div className="flex items-center space-x-2">
            <div className="flex-1 border-border border-t" />
            <span className="px-2 text-muted-foreground text-xs">OR</span>
            <div className="flex-1 border-border border-t" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            className="w-full"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Select from existing media
          </Button>
        </>
      )}

      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            <AnimatePresence>
              {mediaFiles.map((media) => (
                <MediaPreview
                  key={media.id}
                  media={media}
                  onRemove={removeFile}
                  getPreviewAspectRatio={getPreviewAspectRatio}
                />
              ))}
            </AnimatePresence>

            {canUploadMore && mediaFiles.length > 0 && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex items-center justify-center rounded-lg border-2 border-border border-dashed bg-muted/50 transition-colors hover:border-input hover:bg-muted',
                  getAddButtonAspectRatio()
                )}
                title={platformHint}
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
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
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleSelectExistingMedia}
        socialType={socialType}
        currentMedia={mediaFiles.map((m) => ({
          id: m.id,
          url: m.url || m.previewUrl,
          bucketKey: m.bucketKey || '',
          mediaType: m.mediaType,
          originalFilename: m.originalFilename,
          size: m.size,
          extension: m.extension,
          altText: m.altText,
          createdAt: new Date().toISOString(),
        }))}
        maxImages={maxImages}
        maxVideos={maxVideos}
      />
    </div>
  );
}
