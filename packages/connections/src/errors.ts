import { Schema } from "effect";

const fields = <Code extends string>(code: Code, retryable: boolean) => ({
  code: Schema.Literal(code),
  provider: Schema.String,
  message: Schema.String,
  retryable: retryable ? Schema.Literal(true) : Schema.Literal(false),
});

export class RateLimitedError extends Schema.TaggedErrorClass<RateLimitedError>()(
  "RateLimitedError",
  fields("RATE_LIMITED", true)
) {}
export class NetworkConnectionError extends Schema.TaggedErrorClass<NetworkConnectionError>()(
  "NetworkConnectionError",
  fields("NETWORK_ERROR", true)
) {}
export class TokenExpiredError extends Schema.TaggedErrorClass<TokenExpiredError>()(
  "TokenExpiredError",
  fields("TOKEN_EXPIRED", false)
) {}
export class MediaProcessingTimeoutError extends Schema.TaggedErrorClass<MediaProcessingTimeoutError>()(
  "MediaProcessingTimeoutError",
  fields("MEDIA_PROCESSING_TIMEOUT", true)
) {}
export class InvalidMediaError extends Schema.TaggedErrorClass<InvalidMediaError>()(
  "InvalidMediaError",
  fields("INVALID_MEDIA", false)
) {}
export class ProfileNotFoundError extends Schema.TaggedErrorClass<ProfileNotFoundError>()(
  "ProfileNotFoundError",
  fields("PROFILE_NOT_FOUND", false)
) {}
export class PublishRejectedError extends Schema.TaggedErrorClass<PublishRejectedError>()(
  "PublishRejectedError",
  fields("PUBLISH_REJECTED", false)
) {}
export class AmbiguousPublishError extends Schema.TaggedErrorClass<AmbiguousPublishError>()(
  "AmbiguousPublishError",
  fields("AMBIGUOUS_PUBLISH", false)
) {}
export class MediaProcessingError extends Schema.TaggedErrorClass<MediaProcessingError>()(
  "MediaProcessingError",
  fields("MEDIA_PROCESSING_FAILED", false)
) {}
export class ProviderApiError extends Schema.TaggedErrorClass<ProviderApiError>()(
  "ProviderApiError",
  {
    code: Schema.Literal("API_ERROR"),
    provider: Schema.String,
    message: Schema.String,
    retryable: Schema.Boolean,
  }
) {}

export type ConnectionError =
  | RateLimitedError
  | NetworkConnectionError
  | TokenExpiredError
  | MediaProcessingTimeoutError
  | InvalidMediaError
  | ProfileNotFoundError
  | PublishRejectedError
  | AmbiguousPublishError
  | MediaProcessingError
  | ProviderApiError;

export const isConnectionError = (value: unknown): value is ConnectionError =>
  value instanceof Error &&
  typeof value === "object" &&
  "provider" in value &&
  "retryable" in value &&
  "code" in value;

export const rateLimited = (provider: string, message = "Rate limited") =>
  new RateLimitedError({
    code: "RATE_LIMITED",
    provider,
    message,
    retryable: true,
  });
export const networkError = (provider: string, operation: string) =>
  new NetworkConnectionError({
    code: "NETWORK_ERROR",
    provider,
    message: `Network error during ${operation} for ${provider}`,
    retryable: true,
  });
export const tokenExpired = (
  provider: string,
  message = "Access token expired"
) =>
  new TokenExpiredError({
    code: "TOKEN_EXPIRED",
    provider,
    message,
    retryable: false,
  });
export const mediaProcessingTimeout = (provider: string) =>
  new MediaProcessingTimeoutError({
    code: "MEDIA_PROCESSING_TIMEOUT",
    provider,
    message: `Media processing timed out for ${provider}`,
    retryable: true,
  });
export const invalidMedia = (provider: string, reason: string) =>
  new InvalidMediaError({
    code: "INVALID_MEDIA",
    provider,
    message: `Invalid media for ${provider}: ${reason}`,
    retryable: false,
  });
export const profileNotFound = (provider: string) =>
  new ProfileNotFoundError({
    code: "PROFILE_NOT_FOUND",
    provider,
    message: `${provider} profile not found or is missing required fields`,
    retryable: false,
  });
export const publishRejected = (provider: string, reason: string) =>
  new PublishRejectedError({
    code: "PUBLISH_REJECTED",
    provider,
    message: `${provider} rejected the post: ${reason}`,
    retryable: false,
  });
export const ambiguousPublish = (provider: string) =>
  new AmbiguousPublishError({
    code: "AMBIGUOUS_PUBLISH",
    provider,
    message: `${provider} did not confirm whether the post was created. Verify the provider account before retrying to avoid a duplicate.`,
    retryable: false,
  });
export const mediaProcessingError = (provider: string, reason?: string) =>
  new MediaProcessingError({
    code: "MEDIA_PROCESSING_FAILED",
    provider,
    message: `Media processing failed for ${provider}${reason ? `: ${reason}` : ""}`,
    retryable: false,
  });
export const apiError = (
  provider: string,
  status: number,
  apiMessage?: string
): ConnectionError => {
  const message = `${provider} API error (${status})${apiMessage ? `: ${apiMessage}` : ""}`;
  return status === 429
    ? new RateLimitedError({
        code: "RATE_LIMITED",
        provider,
        message,
        retryable: true,
      })
    : new ProviderApiError({
        code: "API_ERROR",
        provider,
        message,
        retryable: status >= 500,
      });
};
export const fromUnknownHttp = (
  provider: string,
  error: unknown
): ConnectionError => {
  if (isConnectionError(error)) {
    return error;
  }
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: { message?: string; error?: { message?: string } };
        };
      }
    ).response;
    if (response?.status) {
      return apiError(
        provider,
        response.status,
        response.data?.message ?? response.data?.error?.message
      );
    }
  }
  return networkError(provider, "request");
};

/** Classify a final create call conservatively so automatic retries cannot
 * duplicate a post whose response was lost after the provider accepted it. */
export const fromUnknownCreate = (
  provider: string,
  error: unknown
): ConnectionError => {
  const classified = fromUnknownHttp(provider, error);
  if (
    classified.code === "NETWORK_ERROR" ||
    (classified.code === "API_ERROR" && classified.retryable)
  ) {
    return ambiguousPublish(provider);
  }
  return classified;
};
