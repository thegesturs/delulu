/**
 * Consolidated platform rules and validation utilities
 * Combines media requirements, character limits, layout rules, and video validation
 */

import type { FullPostType, SocialProviderType } from '@delulu/validators/post';
import { SocialTypes } from '@delulu/validators/post';
import type { SocialType } from '@delulu/validators/post';

// ============================================================================
// MEDIA REQUIREMENTS
// ============================================================================

export interface PlatformMediaRules {
  requiresVideo: boolean;
  requiresImage: boolean;
  requiresEither: boolean; // Requires at least video OR image
  allowsMultipleImages: boolean;
  allowsMultipleVideos: boolean;
}

export const PLATFORM_MEDIA_RULES: Record<SocialType, PlatformMediaRules> = {
  [SocialTypes.TIKTOK]: {
    requiresVideo: true,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: false,
    allowsMultipleVideos: false,
  },
  [SocialTypes.YOUTUBE]: {
    requiresVideo: true,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: false,
    allowsMultipleVideos: false,
  },
  [SocialTypes.INSTAGRAM]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: true, // Needs video OR images
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
  [SocialTypes.THREADS]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: false,
    allowsMultipleVideos: false,
  },
  [SocialTypes.TWITTER]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
  [SocialTypes.LINKEDIN]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
  [SocialTypes.FACEBOOK]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
  [SocialTypes.PINTEREST]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
  [SocialTypes.FARCASTER]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: false,
    allowsMultipleVideos: false,
  },
  [SocialTypes.BLUESKY]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
  [SocialTypes.LENS]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: false,
    allowsMultipleVideos: false,
  },
  [SocialTypes.DEFAULT]: {
    requiresVideo: false,
    requiresImage: false,
    requiresEither: false,
    allowsMultipleImages: true,
    allowsMultipleVideos: false,
  },
};

// ============================================================================
// CHARACTER LIMITS
// ============================================================================

export const PLATFORM_CHARACTER_LIMITS: Record<SocialType, number | undefined> =
  {
    [SocialTypes.TWITTER]: 280,
    [SocialTypes.THREADS]: 500,
    [SocialTypes.INSTAGRAM]: 2200,
    [SocialTypes.TIKTOK]: 2200,
    [SocialTypes.YOUTUBE]: 5000,
    [SocialTypes.LINKEDIN]: 3000,
    [SocialTypes.FACEBOOK]: 63206,
    [SocialTypes.PINTEREST]: 500,
    [SocialTypes.FARCASTER]: 320,
    [SocialTypes.BLUESKY]: 300,
    [SocialTypes.LENS]: 500,
    [SocialTypes.DEFAULT]: undefined,
  };

// ============================================================================
// IMAGE COUNT LIMITS
// ============================================================================

export const PLATFORM_IMAGE_LIMITS: Record<SocialType, number> = {
  [SocialTypes.TWITTER]: 4,
  [SocialTypes.LINKEDIN]: 4,
  [SocialTypes.FACEBOOK]: 10,
  [SocialTypes.INSTAGRAM]: 10,
  [SocialTypes.PINTEREST]: 5,
  [SocialTypes.TIKTOK]: 1, // Thumbnail only
  [SocialTypes.YOUTUBE]: 1, // Thumbnail only
  [SocialTypes.THREADS]: 10,
  [SocialTypes.FARCASTER]: 2,
  [SocialTypes.BLUESKY]: 4,
  [SocialTypes.LENS]: 4,
  [SocialTypes.DEFAULT]: 4,
};

// ============================================================================
// PLATFORM DISPLAY NAMES
// ============================================================================

const PLATFORM_DISPLAY_NAMES: Record<SocialType, string> = {
  [SocialTypes.TIKTOK]: 'TikTok',
  [SocialTypes.YOUTUBE]: 'YouTube Shorts',
  [SocialTypes.INSTAGRAM]: 'Instagram Reels',
  [SocialTypes.THREADS]: 'Threads',
  [SocialTypes.TWITTER]: 'X (Twitter)',
  [SocialTypes.LINKEDIN]: 'LinkedIn',
  [SocialTypes.FACEBOOK]: 'Facebook',
  [SocialTypes.PINTEREST]: 'Pinterest',
  [SocialTypes.FARCASTER]: 'Farcaster',
  [SocialTypes.BLUESKY]: 'Bluesky',
  [SocialTypes.LENS]: 'Lens',
  [SocialTypes.DEFAULT]: 'Default',
};

// ============================================================================
// DEFAULT TAB HELPERS
// ============================================================================

/**
 * Determines which platforms are included in the "Default" content
 * (i.e., selected platforms that don't have alternative content)
 */
export function getPlatformsInDefault(
  selectedProviders: SocialProviderType[],
  alternativeContent: FullPostType['alternativeContent']
): SocialType[] {
  const alternativeProviderIds = new Set(
    alternativeContent.map((alt) => alt.socialProvider.socialId)
  );

  return selectedProviders
    .filter((provider) => !alternativeProviderIds.has(provider.socialId))
    .map((provider) => provider.socialType);
}

/**
 * Gets the provider object for a single platform in default
 * Returns null if multiple or no platforms in default
 */
export function getSingleProviderInDefault(
  selectedProviders: SocialProviderType[],
  alternativeContent: FullPostType['alternativeContent']
): SocialProviderType | null {
  const alternativeProviderIds = new Set(
    alternativeContent.map((alt) => alt.socialProvider.socialId)
  );

  const providersInDefault = selectedProviders.filter(
    (provider) => !alternativeProviderIds.has(provider.socialId)
  );

  return providersInDefault.length === 1 ? providersInDefault[0] : null;
}

/**
 * Determines if Default should use video-only layout
 * True if ONLY video platforms (TikTok, YouTube) are in default
 */
export function shouldDefaultUseVideoLayout(
  platformsInDefault: SocialType[]
): boolean {
  if (platformsInDefault.length === 0) {
    return false;
  }

  const videoPlatforms = [SocialTypes.TIKTOK, SocialTypes.YOUTUBE] as const;

  return platformsInDefault.every((platform) =>
    (videoPlatforms as readonly SocialType[]).includes(platform)
  );
}

/**
 * Gets the most restrictive character limit from platforms in default
 */
export function getDefaultCharacterLimit(
  platformsInDefault: SocialType[]
): number | undefined {
  if (platformsInDefault.length === 0) {
    return undefined;
  }

  const platformLimits = platformsInDefault
    .map((platform) => PLATFORM_CHARACTER_LIMITS[platform])
    .filter((limit): limit is number => limit !== undefined);

  return platformLimits.length > 0 ? Math.min(...platformLimits) : undefined;
}

/**
 * Gets the most restrictive image count from platforms in default
 */
export function getDefaultMaxImages(platformsInDefault: SocialType[]): number {
  if (platformsInDefault.length === 0) {
    return 4; // Default fallback
  }

  const platformLimits = platformsInDefault.map(
    (platform) => PLATFORM_IMAGE_LIMITS[platform]
  );

  return Math.min(...platformLimits);
}

/**
 * Checks if YouTube is in default (to show title field)
 */
export function shouldShowYouTubeTitle(
  platformsInDefault: SocialType[]
): boolean {
  return platformsInDefault.includes(SocialTypes.YOUTUBE);
}

/**
 * Gets placeholder text based on primary platform in default
 */
export function getDefaultPlaceholder(
  platformsInDefault: SocialType[]
): string {
  if (platformsInDefault.length === 0) {
    return "What's on your mind?";
  }

  const platform = platformsInDefault[0];

  const placeholders: Record<SocialType, string> = {
    [SocialTypes.TWITTER]: "What's happening?",
    [SocialTypes.TIKTOK]: 'Write a catchy caption for your TikTok...',
    [SocialTypes.YOUTUBE]: 'Describe your YouTube Short...',
    [SocialTypes.INSTAGRAM]: 'Write a caption for your post...',
    [SocialTypes.LINKEDIN]: 'Share your professional update...',
    [SocialTypes.FACEBOOK]: "What's on your mind?",
    [SocialTypes.THREADS]: "What's on your mind?",
    [SocialTypes.PINTEREST]: 'Describe your pin...',
    [SocialTypes.FARCASTER]: 'Share your thoughts...',
    [SocialTypes.BLUESKY]: "What's up?",
    [SocialTypes.LENS]: 'Share with your community...',
    [SocialTypes.DEFAULT]: "What's on your mind?",
  };

  return placeholders[platform] || "What's on your mind?";
}

/**
 * Checks if any platform in default requires video
 */
export function doesDefaultRequireVideo(
  platformsInDefault: SocialType[]
): boolean {
  const videoRequiredPlatforms = [
    SocialTypes.TIKTOK,
    SocialTypes.YOUTUBE,
  ] as const;
  return platformsInDefault.some((platform) =>
    (videoRequiredPlatforms as readonly SocialType[]).includes(platform)
  );
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates media content against platform rules
 */
export function validatePlatformMedia(
  socialType: SocialType,
  media: { mediaType: 'IMAGE' | 'VIDEO' }[]
): ValidationResult {
  const rules = PLATFORM_MEDIA_RULES[socialType];
  const errors: string[] = [];

  const videoCount = media.filter((m) => m.mediaType === 'VIDEO').length;
  const imageCount = media.filter((m) => m.mediaType === 'IMAGE').length;

  if (rules.requiresVideo && videoCount === 0) {
    const platformName = getPlatformDisplayName(socialType);
    errors.push(`${platformName} requires a video to post`);
  }

  if (rules.requiresImage && imageCount === 0) {
    const platformName = getPlatformDisplayName(socialType);
    errors.push(`${platformName} requires an image to post`);
  }

  if (rules.requiresEither && videoCount === 0 && imageCount === 0) {
    const platformName = getPlatformDisplayName(socialType);
    errors.push(`${platformName} requires a video or images to post`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get human-readable platform name
 */
export function getPlatformDisplayName(socialType: SocialType): string {
  return PLATFORM_DISPLAY_NAMES[socialType] || socialType;
}

/**
 * Get validation error message for missing media
 */
export function getMediaRequirementMessage(socialType: SocialType): string {
  const rules = PLATFORM_MEDIA_RULES[socialType];
  const platformName = getPlatformDisplayName(socialType);

  if (rules.requiresVideo) {
    return `${platformName} requires a video`;
  }

  if (rules.requiresImage) {
    return `${platformName} requires an image`;
  }

  if (rules.requiresEither) {
    return `${platformName} requires a video or images`;
  }

  return `${platformName} allows optional media`;
}

// ============================================================================
// VIDEO-SPECIFIC VALIDATION
// ============================================================================

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    duration: number; // in seconds
    size: number; // in bytes
    width: number;
    height: number;
    type: string;
    fileName: string;
  };
}

export interface PlatformVideoRules {
  minDuration: number; // seconds
  maxDuration: number; // seconds
  maxFileSize: number; // bytes
  allowedFormats: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const PLATFORM_VIDEO_RULES = {
  TIKTOK: {
    minDuration: 15,
    maxDuration: 600, // 10 minutes
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['video/mp4', 'video/quicktime', 'video/webm'],
    minWidth: 480,
    minHeight: 640,
  },
  INSTAGRAM: {
    minDuration: 3,
    maxDuration: 90,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ['video/mp4', 'video/quicktime'],
  },
  YOUTUBE: {
    minDuration: 1,
    maxDuration: 43200, // 12 hours
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    allowedFormats: ['video/mp4', 'video/quicktime', 'video/webm'],
  },
} as const;

/**
 * Validates a video file against platform-specific rules
 */
export async function validateVideo(
  file: File,
  rules: PlatformVideoRules
): Promise<VideoValidationResult> {
  const errors: string[] = [];

  try {
    if (!rules.allowedFormats.includes(file.type)) {
      errors.push(
        `Unsupported video format. Allowed formats: ${rules.allowedFormats.join(', ')}`
      );
    }

    if (file.size > rules.maxFileSize) {
      const maxSizeMB = Math.round(rules.maxFileSize / (1024 * 1024));
      errors.push(`File size too large. Maximum: ${maxSizeMB}MB`);
    }

    const metadata = await getVideoMetadata(file);

    if (metadata.duration < rules.minDuration) {
      errors.push(`Video too short. Minimum: ${rules.minDuration} seconds`);
    }

    if (metadata.duration > rules.maxDuration) {
      const maxMinutes = Math.floor(rules.maxDuration / 60);
      errors.push(`Video too long. Maximum: ${maxMinutes} minutes`);
    }

    if (rules.minWidth && metadata.width < rules.minWidth) {
      errors.push(`Video width too small. Minimum: ${rules.minWidth}px`);
    }

    if (rules.minHeight && metadata.height < rules.minHeight) {
      errors.push(`Video height too small. Minimum: ${rules.minHeight}px`);
    }

    if (rules.maxWidth && metadata.width > rules.maxWidth) {
      errors.push(`Video width too large. Maximum: ${rules.maxWidth}px`);
    }

    if (rules.maxHeight && metadata.height > rules.maxHeight) {
      errors.push(`Video height too large. Maximum: ${rules.maxHeight}px`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Failed to validate video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Extract video metadata using HTML5 video element
 */
async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
  fileName: string;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);

      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        type: file.type,
        fileName: file.name,
      });
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video metadata'));
    });

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Video metadata loading timeout'));
    }, 10000);

    video.src = objectUrl;
    video.load();
  });
}

/**
 * Quick validation for TikTok videos
 */
export async function validateTikTokVideo(
  file: File,
  maxDurationSec?: number
): Promise<VideoValidationResult> {
  const rules = maxDurationSec
    ? { ...PLATFORM_VIDEO_RULES.TIKTOK, maxDuration: maxDurationSec }
    : PLATFORM_VIDEO_RULES.TIKTOK;
  return validateVideo(file, rules);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
