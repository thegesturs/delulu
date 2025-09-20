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

// TikTok video requirements
export const TIKTOK_VIDEO_RULES: PlatformVideoRules = {
  minDuration: 15, // 15 seconds minimum
  maxDuration: 600, // 10 minutes maximum
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedFormats: ['video/mp4', 'video/quicktime', 'video/webm'],
  minWidth: 480,
  minHeight: 640, // TikTok prefers vertical videos
};

// Other platform rules can be added here
export const PLATFORM_VIDEO_RULES = {
  TIKTOK: TIKTOK_VIDEO_RULES,
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
 * Validates a video file against platform-specific rules using browser APIs
 */
export async function validateVideo(
  file: File,
  rules: PlatformVideoRules
): Promise<VideoValidationResult> {
  const errors: string[] = [];

  try {
    // Basic file validation
    if (!rules.allowedFormats.includes(file.type)) {
      errors.push(
        `Unsupported video format. Allowed formats: ${rules.allowedFormats.join(', ')}`
      );
    }

    if (file.size > rules.maxFileSize) {
      const maxSizeMB = Math.round(rules.maxFileSize / (1024 * 1024));
      errors.push(`File size too large. Maximum: ${maxSizeMB}MB`);
    }

    // Get video metadata using HTML5 video element
    const metadata = await getVideoMetadata(file);

    // Duration validation
    if (metadata.duration < rules.minDuration) {
      errors.push(`Video too short. Minimum: ${rules.minDuration} seconds`);
    }

    if (metadata.duration > rules.maxDuration) {
      const maxMinutes = Math.floor(rules.maxDuration / 60);
      errors.push(`Video too long. Maximum: ${maxMinutes} minutes`);
    }

    // Dimension validation (if specified)
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
      // Clean up the object URL to prevent memory leaks
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

    // Set a timeout to prevent hanging
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Video metadata loading timeout'));
    }, 10000); // 10 second timeout

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
    ? { ...TIKTOK_VIDEO_RULES, maxDuration: maxDurationSec }
    : TIKTOK_VIDEO_RULES;
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
