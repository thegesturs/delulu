// Base error types for all social providers
export abstract class SocialProviderError extends Error {
  abstract readonly code: string;
  abstract readonly provider: string;
}

// Authentication errors
export class ProfileNotFoundError extends SocialProviderError {
  readonly code = 'PROFILE_NOT_FOUND';
  constructor(public readonly provider: string) {
    super(`${provider} profile not found or is missing required fields`);
    this.name = 'ProfileNotFoundError';
  }
}

export class InvalidAccessTokenError extends SocialProviderError {
  readonly code = 'INVALID_ACCESS_TOKEN';
  constructor(public readonly provider: string) {
    super(`Invalid or expired access token for ${provider}`);
    this.name = 'InvalidAccessTokenError';
  }
}

// Content errors
export class NoContentError extends SocialProviderError {
  readonly code = 'NO_CONTENT';
  constructor(public readonly provider: string) {
    super('No content to publish');
    this.name = 'NoContentError';
  }
}

export class InvalidMediaError extends SocialProviderError {
  readonly code = 'INVALID_MEDIA';
  constructor(public readonly provider: string, public readonly reason: string) {
    super(`Invalid media for ${provider}: ${reason}`);
    this.name = 'InvalidMediaError';
  }
}

export class MediaUploadError extends SocialProviderError {
  readonly code = 'MEDIA_UPLOAD_FAILED';
  constructor(public readonly provider: string, public readonly mediaType: 'IMAGE' | 'VIDEO') {
    super(`Failed to upload ${mediaType.toLowerCase()} to ${provider}`);
    this.name = 'MediaUploadError';
  }
}

// Processing errors
export class MediaProcessingError extends SocialProviderError {
  readonly code = 'MEDIA_PROCESSING_FAILED';
  constructor(public readonly provider: string, public readonly reason?: string) {
    super(`Media processing failed for ${provider}${reason ? `: ${reason}` : ''}`);
    this.name = 'MediaProcessingError';
  }
}

export class MediaProcessingTimeoutError extends SocialProviderError {
  readonly code = 'MEDIA_PROCESSING_TIMEOUT';
  constructor(public readonly provider: string) {
    super(`Media processing timed out for ${provider}`);
    this.name = 'MediaProcessingTimeoutError';
  }
}

// Publishing errors
export class PublishError extends SocialProviderError {
  readonly code = 'PUBLISH_FAILED';
  constructor(public readonly provider: string, public readonly reason?: string) {
    super(`Failed to publish to ${provider}${reason ? `: ${reason}` : ''}`);
    this.name = 'PublishError';
  }
}

export class PostCreationError extends SocialProviderError {
  readonly code = 'POST_CREATION_FAILED';
  constructor(public readonly provider: string) {
    super(`Failed to create post on ${provider}`);
    this.name = 'PostCreationError';
  }
}

// API errors
export class APIError extends SocialProviderError {
  readonly code = 'API_ERROR';
  constructor(
    public readonly provider: string, 
    public readonly statusCode: number,
    public readonly apiMessage?: string
  ) {
    super(`${provider} API error (${statusCode})${apiMessage ? `: ${apiMessage}` : ''}`);
    this.name = 'APIError';
  }
}

export class RateLimitError extends SocialProviderError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  constructor(public readonly provider: string, public readonly retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
  }
}

// Network errors
export class NetworkError extends SocialProviderError {
  readonly code = 'NETWORK_ERROR';
  constructor(public readonly provider: string, public readonly operation: string) {
    super(`Network error during ${operation} for ${provider}`);
    this.name = 'NetworkError';
  }
}

// Platform-specific errors
export class FacebookError extends SocialProviderError {
  readonly code = 'FACEBOOK_ERROR';
  readonly provider = 'Facebook';
  constructor(message: string) {
    super(message);
    this.name = 'FacebookError';
  }
}

export class InstagramError extends SocialProviderError {
  readonly code = 'INSTAGRAM_ERROR';
  readonly provider = 'Instagram';
  constructor(message: string) {
    super(message);
    this.name = 'InstagramError';
  }
}

export class LinkedInError extends SocialProviderError {
  readonly code = 'LINKEDIN_ERROR';
  readonly provider = 'LinkedIn';
  constructor(message: string) {
    super(message);
    this.name = 'LinkedInError';
  }
}

export class ThreadsError extends SocialProviderError {
  readonly code = 'THREADS_ERROR';
  readonly provider = 'Threads';
  constructor(message: string) {
    super(message);
    this.name = 'ThreadsError';
  }
}

export class YouTubeError extends SocialProviderError {
  readonly code = 'YOUTUBE_ERROR';
  readonly provider = 'YouTube';
  constructor(message: string) {
    super(message);
    this.name = 'YouTubeError';
  }
}

export class TwitterError extends SocialProviderError {
  readonly code = 'TWITTER_ERROR';
  readonly provider = 'Twitter';
  constructor(message: string) {
    super(message);
    this.name = 'TwitterError';
  }
}

export class TikTokError extends SocialProviderError {
  readonly code = 'TIKTOK_ERROR';
  readonly provider = 'TikTok';
  constructor(message: string) {
    super(message);
    this.name = 'TikTokError';
  }
}

export class PinterestError extends SocialProviderError {
  readonly code = 'PINTEREST_ERROR';
  readonly provider = 'Pinterest';
  constructor(message: string) {
    super(message);
    this.name = 'PinterestError';
  }
}

export class FarcasterError extends SocialProviderError {
  readonly code = 'FARCASTER_ERROR';
  readonly provider = 'Farcaster';
  constructor(message: string) {
    super(message);
    this.name = 'FarcasterError';
  }
}

// Helper function to create API errors from axios errors
export function createAPIError(provider: string, error: any): APIError {
  if (error?.response?.status) {
    return new APIError(
      provider,
      error.response.status,
      error.response.data?.message || error.response.data?.error?.message
    );
  }
  return new APIError(provider, 500, 'Unknown API error');
}

// Helper function to determine if error is retryable
export function isRetryableError(error: SocialProviderError): boolean {
  return error instanceof NetworkError || 
         error instanceof RateLimitError ||
         (error instanceof APIError && error.statusCode >= 500);
}