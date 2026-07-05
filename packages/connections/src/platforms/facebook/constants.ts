/** Graph API version for publish + OAuth + page listing (matches the prior provider). */
export const GRAPH_VERSION = "v23.0";

export const PROVIDER = "Facebook";

/** Character limit — the FACEBOOK slice of PLATFORM_CHARACTER_LIMITS. */
export const MESSAGE_LIMIT = 63_206;

/** Image count limit — FACEBOOK slice of PLATFORM_IMAGE_LIMITS. */
export const MAX_IMAGES = 10;

/** Video-processing poll cadence (matches `waitForVideoProcessing` defaults). */
export const POLL_MAX_ATTEMPTS = 30;
export const POLL_INTERVAL_MS = 10_000;
