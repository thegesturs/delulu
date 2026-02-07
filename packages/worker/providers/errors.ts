// Base error types for all social providers
export abstract class SocialProviderError extends Error {
  abstract readonly code: string;
  abstract readonly provider: string;
}

// Authentication errors
export class ProfileNotFoundError extends SocialProviderError {
  readonly code = "PROFILE_NOT_FOUND";
  readonly provider: string;

  constructor(provider: string) {
    super(`${provider} profile not found or is missing required fields`);
    this.name = "ProfileNotFoundError";
    this.provider = provider;
  }
}

export class InvalidAccessTokenError extends SocialProviderError {
  readonly code = "INVALID_ACCESS_TOKEN";
  readonly provider: string;

  constructor(provider: string) {
    super(`Invalid or expired access token for ${provider}`);
    this.name = "InvalidAccessTokenError";
    this.provider = provider;
  }
}

// Content errors
export class NoContentError extends SocialProviderError {
  readonly code = "NO_CONTENT";
  readonly provider: string;

  constructor(provider: string) {
    super("No content to publish");
    this.name = "NoContentError";
    this.provider = provider;
  }
}

export class InvalidMediaError extends SocialProviderError {
  readonly code = "INVALID_MEDIA";
  readonly provider: string;
  readonly reason: string;

  constructor(provider: string, reason: string) {
    super(`Invalid media for ${provider}: ${reason}`);
    this.name = "InvalidMediaError";
    this.provider = provider;
    this.reason = reason;
  }
}

export class MediaUploadError extends SocialProviderError {
  readonly code = "MEDIA_UPLOAD_FAILED";
  readonly provider: string;
  readonly mediaType: "IMAGE" | "VIDEO";

  constructor(provider: string, mediaType: "IMAGE" | "VIDEO") {
    super(`Failed to upload ${mediaType.toLowerCase()} to ${provider}`);
    this.name = "MediaUploadError";
    this.provider = provider;
    this.mediaType = mediaType;
  }
}

// Processing errors
export class MediaProcessingError extends SocialProviderError {
  readonly code = "MEDIA_PROCESSING_FAILED";
  readonly provider: string;
  readonly reason?: string;

  constructor(provider: string, reason?: string) {
    super(
      `Media processing failed for ${provider}${reason ? `: ${reason}` : ""}`
    );
    this.name = "MediaProcessingError";
    this.provider = provider;
    this.reason = reason;
  }
}

export class MediaProcessingTimeoutError extends SocialProviderError {
  readonly code = "MEDIA_PROCESSING_TIMEOUT";
  readonly provider: string;

  constructor(provider: string) {
    super(`Media processing timed out for ${provider}`);
    this.name = "MediaProcessingTimeoutError";
    this.provider = provider;
  }
}

// Publishing errors
export class PublishError extends SocialProviderError {
  readonly code = "PUBLISH_FAILED";
  readonly provider: string;
  readonly reason?: string;

  constructor(provider: string, reason?: string) {
    super(`Failed to publish to ${provider}${reason ? `: ${reason}` : ""}`);
    this.name = "PublishError";
    this.provider = provider;
    this.reason = reason;
  }
}

export class PostCreationError extends SocialProviderError {
  readonly code = "POST_CREATION_FAILED";
  readonly provider: string;

  constructor(provider: string) {
    super(`Failed to create post on ${provider}`);
    this.name = "PostCreationError";
    this.provider = provider;
  }
}

// API errors
export class APIError extends SocialProviderError {
  readonly code = "API_ERROR";
  readonly provider: string;
  readonly statusCode: number;
  readonly apiMessage?: string;

  constructor(provider: string, statusCode: number, apiMessage?: string) {
    super(
      `${provider} API error (${statusCode})${apiMessage ? `: ${apiMessage}` : ""}`
    );
    this.name = "APIError";
    this.provider = provider;
    this.statusCode = statusCode;
    this.apiMessage = apiMessage;
  }
}

export class RateLimitError extends SocialProviderError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly provider: string;
  readonly retryAfter?: number;

  constructor(provider: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${provider}${retryAfter ? `. Retry after ${retryAfter}s` : ""}`
    );
    this.name = "RateLimitError";
    this.provider = provider;
    this.retryAfter = retryAfter;
  }
}

// Network errors
export class NetworkError extends SocialProviderError {
  readonly code = "NETWORK_ERROR";
  readonly provider: string;
  readonly operation: string;

  constructor(provider: string, operation: string) {
    super(`Network error during ${operation} for ${provider}`);
    this.name = "NetworkError";
    this.provider = provider;
    this.operation = operation;
  }
}

// Platform-specific errors
export class FacebookError extends SocialProviderError {
  readonly code = "FACEBOOK_ERROR";
  readonly provider = "Facebook";

  constructor(message: string) {
    super(message);
    this.name = "FacebookError";
  }
}

export class InstagramError extends SocialProviderError {
  readonly code = "INSTAGRAM_ERROR";
  readonly provider = "Instagram";

  constructor(message: string) {
    super(message);
    this.name = "InstagramError";
  }
}

export class LinkedInError extends SocialProviderError {
  readonly code = "LINKEDIN_ERROR";
  readonly provider = "LinkedIn";

  constructor(message: string) {
    super(message);
    this.name = "LinkedInError";
  }
}

export class ThreadsError extends SocialProviderError {
  readonly code = "THREADS_ERROR";
  readonly provider = "Threads";

  constructor(message: string) {
    super(message);
    this.name = "ThreadsError";
  }
}

export class YouTubeError extends SocialProviderError {
  readonly code = "YOUTUBE_ERROR";
  readonly provider = "YouTube";

  constructor(message: string) {
    super(message);
    this.name = "YouTubeError";
  }
}

export class TwitterError extends SocialProviderError {
  readonly code = "TWITTER_ERROR";
  readonly provider = "Twitter";

  constructor(message: string) {
    super(message);
    this.name = "TwitterError";
  }
}

export class TikTokError extends SocialProviderError {
  readonly code = "TIKTOK_ERROR";
  readonly provider = "TikTok";

  constructor(message: string) {
    super(message);
    this.name = "TikTokError";
  }
}

export class TokenRefreshError extends SocialProviderError {
  readonly code = "TOKEN_REFRESH_FAILED";
  readonly provider: string;

  constructor(provider: string, message?: string) {
    super(message || `Failed to refresh access token for ${provider}`);
    this.name = "TokenRefreshError";
    this.provider = provider;
  }
}

export class PinterestError extends SocialProviderError {
  readonly code = "PINTEREST_ERROR";
  readonly provider = "Pinterest";

  constructor(message: string) {
    super(message);
    this.name = "PinterestError";
  }
}

export class FarcasterError extends SocialProviderError {
  readonly code = "FARCASTER_ERROR";
  readonly provider = "Farcaster";

  constructor(message: string) {
    super(message);
    this.name = "FarcasterError";
  }
}

export class R2Error extends SocialProviderError {
  readonly code = "R2_ERROR";
  readonly provider = "R2";

  constructor(message: string) {
    super(message);
    this.name = "R2Error";
  }
}

export class BlueskyError extends SocialProviderError {
  readonly code = "BLUESKY_ERROR";
  readonly provider = "Bluesky";

  constructor(message: string) {
    super(message);
    this.name = "BlueskyError";
  }
}

// Helper function to create API errors from axios errors
export function createAPIError(provider: string, error: unknown): APIError {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { message?: string; error?: { message?: string } };
      };
    };
    if (axiosError.response?.status) {
      return new APIError(
        provider,
        axiosError.response.status,
        axiosError.response.data?.message ||
          axiosError.response.data?.error?.message
      );
    }
  }
  return new APIError(provider, 500, "Unknown API error");
}

// Helper function to determine if error is retryable
export function isRetryableError(error: SocialProviderError): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof RateLimitError ||
    (error instanceof APIError && error.statusCode >= 500)
  );
}
