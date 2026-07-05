/** Warpcast API v2 base — matches the prior worker provider + connect route. */
export const API_BASE = "https://api.warpcast.com/v2";

export const PROVIDER = "Farcaster";

/** Cast character limit — the FARCASTER slice of the old platform-rules. */
export const CAST_LIMIT = 320;

/** Image count limit — FARCASTER slice of PLATFORM_IMAGE_LIMITS. */
export const MAX_IMAGES = 2;

/**
 * Static Warpcast connect URL. Farcaster has no standard OAuth — connecting
 * happens through Warpcast's signed-key-request (signer approval) flow. This is
 * the entry point the old connect-url service returned for FARCASTER.
 */
export const CONNECT_URL =
  "https://warpcast.com/~/developers/signed-key-requests";
