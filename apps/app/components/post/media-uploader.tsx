'use client';

import {
  ImageIcon,
  Plus,
  Upload,
  VideoIcon as Video,
  XIcon as X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

import { useStore } from '@/store/post';
import { Button } from '@delulu/design-system/components/ui/button';
import { cn } from '@delulu/design-system/lib/utils';
import type { SocialType } from '@delulu/validators/post';
import { SocialTypes } from '@delulu/validators/post';
import { useShallow } from 'zustand/shallow';

interface MediaFile {
  id: string;
  file: File;
  mediaType: 'IMAGE' | 'VIDEO';
  previewUrl: string;
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
          src={media.previewUrl}
          alt="Preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative h-full w-full">
          <video
            src={media.previewUrl}
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
  let platformHint = 'Twitter/LinkedIn: Up to 4 images OR 1 video.';

  if (socialType === 'TIKTOK' || socialType === 'YOUTUBE') {
    maxImages = 1;
    maxVideos = 1;
    acceptedFileTypes = 'video/mp4,video/quicktime,image/jpeg,image/png';
    uploadInstruction = 'Upload 1 video (16:9) and 1 optional thumbnail';
    aspectRatioInstruction = 'Video: 16:9, Thumbnail: Image';
    platformHint = 'TikTok/YouTube: 1 video (16:9) & 1 thumbnail.';
    if (mediaFiles.some((f) => f.mediaType === 'VIDEO')) {
      acceptedFileTypes = 'image/jpeg,image/png';
    } else if (mediaFiles.some((f) => f.mediaType === 'IMAGE')) {
      acceptedFileTypes = 'video/mp4,video/quicktime';
    }
    countInstruction = `${currentImageCount}/${maxImages} thumbnail, ${currentVideoCount}/${maxVideos} video.`;
  } else if (socialType === 'INSTAGRAM') {
    platformHint = 'Instagram: Up to 10 images OR 1 video.';
    if (mediaFiles.some((f) => f.mediaType === 'VIDEO')) {
      maxImages = 0;
      acceptedFileTypes = 'video/*';
      countInstruction = '1/1 video. No images allowed with video.';
    } else if (
      mediaFiles.length > 0 &&
      mediaFiles.every((f) => f.mediaType === 'IMAGE')
    ) {
      maxVideos = 0;
      acceptedFileTypes = 'image/*';
      countInstruction = `${currentImageCount}/${maxImages} images. Max 1 video (no images).`;
    } else if (mediaFiles.length === 0) {
      acceptedFileTypes = 'image/*,video/*';
      countInstruction = `Up to ${maxImages} images OR 1 video.`;
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
}: UploadZoneProps) {
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
  const { post, setPost } = useStore(
    useShallow((state) => ({
      post: state.post,
      setPost: state.setPost,
    }))
  );

  const [isDragOver, setIsDragOver] = useState(false);
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
        file: media.file!,
        mediaType: media.mediaType,
        previewUrl: media.previewUrl || '',
      }))
      .filter((m) => m.file && m.previewUrl);
  });

  // Update store only when mediaFiles change due to user actions
  useEffect(() => {
    if (isUserAction.current && orderId !== undefined) {
      const storeMedia = mediaFiles.map(({ file, mediaType, previewUrl }) => ({
        file,
        mediaType,
        previewUrl,
      }));

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
    (incomingFiles: File[]) => {
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
        filesToProcess = filesToProcess
          .filter((file) => {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            if (isVideo && !hasVideo && currentVideos < maxVideos) {
              return true;
            }
            if (isImage && !hasImage && currentImages < maxImages) {
              return true;
            }
            return false;
          })
          .slice(0, maxImages + maxVideos - (currentImages + currentVideos));
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

      newMediaFiles = filesToProcess.map((file) => ({
        id: crypto.randomUUID(),
        file,
        mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
        previewUrl: URL.createObjectURL(file),
      }));

      const updatedMediaFiles = [...mediaFiles, ...newMediaFiles];
      isUserAction.current = true;
      setMediaFiles(updatedMediaFiles);
    },
    [mediaFiles, socialType, maxImages, maxVideos]
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

  const getAddButtonAspectRatio = () => {
    if (socialType === 'TIKTOK' || socialType === 'YOUTUBE') {
      const hasVideo = mediaFiles.some((f) => f.mediaType === 'VIDEO');
      const hasImage = mediaFiles.some((f) => f.mediaType === 'IMAGE');
      if (!hasVideo && !hasImage) {
        return 'aspect-video sm:aspect-square';
      }
      if (!hasVideo) {
        return 'aspect-video';
      }
      if (!hasImage) {
        return 'aspect-square';
      }
    }
    return 'aspect-square';
  };

  const getPreviewAspectRatio = (mediaType: 'IMAGE' | 'VIDEO') => {
    if (socialType === 'TIKTOK' || socialType === 'YOUTUBE') {
      if (mediaType === 'VIDEO') {
        return 'aspect-video';
      }
      return 'aspect-square';
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
        />
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
    </div>
  );
}
