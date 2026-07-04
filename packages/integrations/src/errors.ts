import { Data } from "effect";

/**
 * Single tagged error for the whole integration layer. Replaces the neverthrow
 * `SocialProviderError` hierarchy — callers discriminate on `code` and decide
 * retry behaviour from `retryable`.
 *
 * `Data.TaggedError` gives us:
 *  - a real `Error` subclass (so `error.message` works at the boundary),
 *  - structural equality + a `_tag` for Effect's typed error channel,
 *  - `yield*`-ability inside `Effect.gen`.
 */
export class IntegrationError extends Data.TaggedError("IntegrationError")<{
  readonly code: string;
  readonly provider: string;
  readonly message: string;
  readonly retryable: boolean;
}> {}

/** Retryable — SQS should re-deliver (visibility-timeout retry). */
export const rateLimited = (provider: string, message = "Rate limited") =>
  new IntegrationError({ code: "RATE_LIMITED", provider, message, retryable: true });

export const networkError = (provider: string, operation: string) =>
  new IntegrationError({
    code: "NETWORK_ERROR",
    provider,
    message: `Network error during ${operation} for ${provider}`,
    retryable: true,
  });

export const tokenExpired = (provider: string, message = "Access token expired") =>
  new IntegrationError({ code: "TOKEN_EXPIRED", provider, message, retryable: true });

export const mediaProcessingTimeout = (provider: string) =>
  new IntegrationError({
    code: "MEDIA_PROCESSING_TIMEOUT",
    provider,
    message: `Media processing timed out for ${provider}`,
    retryable: true,
  });

/** Non-retryable — needs a user/content fix, retrying will fail identically. */
export const invalidMedia = (provider: string, reason: string) =>
  new IntegrationError({
    code: "INVALID_MEDIA",
    provider,
    message: `Invalid media for ${provider}: ${reason}`,
    retryable: false,
  });

export const profileNotFound = (provider: string) =>
  new IntegrationError({
    code: "PROFILE_NOT_FOUND",
    provider,
    message: `${provider} profile not found or is missing required fields`,
    retryable: false,
  });

export const publishRejected = (provider: string, reason: string) =>
  new IntegrationError({
    code: "PUBLISH_REJECTED",
    provider,
    message: `${provider} rejected the post: ${reason}`,
    retryable: false,
  });

export const mediaProcessingError = (provider: string, reason?: string) =>
  new IntegrationError({
    code: "MEDIA_PROCESSING_FAILED",
    provider,
    message: `Media processing failed for ${provider}${reason ? `: ${reason}` : ""}`,
    retryable: false,
  });

/** Build an error from an HTTP status code — classifies retryability. */
export const apiError = (provider: string, status: number, apiMessage?: string) =>
  new IntegrationError({
    code: status === 429 ? "RATE_LIMITED" : "API_ERROR",
    provider,
    message: `${provider} API error (${status})${apiMessage ? `: ${apiMessage}` : ""}`,
    retryable: status === 429 || status >= 500,
  });

/**
 * Normalise an unknown thrown value (axios error, fetch failure, etc.) into an
 * `IntegrationError`. Mirrors the old `createAPIError` axios inspection.
 */
export const fromUnknownHttp = (provider: string, error: unknown): IntegrationError => {
  if (error instanceof IntegrationError) {
    return error;
  }
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { message?: string; error?: { message?: string } };
      };
    };
    const status = axiosError.response?.status;
    if (status) {
      return apiError(
        provider,
        status,
        axiosError.response?.data?.message ?? axiosError.response?.data?.error?.message
      );
    }
  }
  // No HTTP response → treat as a transient network error.
  return networkError(provider, "request");
};
