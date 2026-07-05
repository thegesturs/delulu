/** LinkedIn provider display name (used in error `provider` fields). */
export const PROVIDER = "LinkedIn";

/**
 * LinkedIn REST API version in YYYYMM format. Matches the prior worker provider
 * (`LinkedIn-Version: 202507`) so behaviour is byte-for-byte identical.
 */
export const LINKEDIN_VERSION = "202507";

/** Character limit for LinkedIn commentary — the LINKEDIN slice of platform-rules. */
export const CHARACTER_LIMIT = 3000;

/** Max images per multi-image post (carousel). */
export const MAX_IMAGES = 4;

/** Document upload ceiling (100MB) — from the prior provider's guard. */
export const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;

/** Video size bounds (75KB – 500MB) — from the prior provider's validation. */
export const MIN_VIDEO_BYTES = 75 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

/** Video upload chunk size (4MB each). */
export const VIDEO_CHUNK_BYTES = 4 * 1024 * 1024;

/** Video processing poll config (30 attempts × 10s = 5 minutes). */
export const VIDEO_POLL_MAX_ATTEMPTS = 30;
export const VIDEO_POLL_INTERVAL_MS = 10_000;
