import type { SocialType } from '@delulu/validators/post';
import { SocialTypes } from '@delulu/validators/post';

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

export interface MediaCounts {
  videoCount: number;
  imageCount: number;
}

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

  // Check if video is required
  if (rules.requiresVideo && videoCount === 0) {
    const platformName = getPlatformDisplayName(socialType);
    errors.push(`${platformName} requires a video to post`);
  }

  // Check if image is required
  if (rules.requiresImage && imageCount === 0) {
    const platformName = getPlatformDisplayName(socialType);
    errors.push(`${platformName} requires an image to post`);
  }

  // Check if either video or image is required
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
function getPlatformDisplayName(socialType: SocialType): string {
  const names: Record<SocialType, string> = {
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

  return names[socialType] || socialType;
}

/**
 * Check if removing a video is allowed (always true, but validation happens on save)
 */
export function canRemoveVideo(socialType: SocialType): boolean {
  // Users can always remove video, validation happens on save/publish
  return true;
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
