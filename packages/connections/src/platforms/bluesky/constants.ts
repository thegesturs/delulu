/** Provider label used in errors + post-URL construction. */
export const PROVIDER = "Bluesky";

/** Bluesky character limit (grapheme-approx). Mirrors the BLUESKY slice of the
 * old `platform-rules.ts` PLATFORM_CHARACTER_LIMITS. */
export const CHARACTER_LIMIT = 300;

/** Max images per Bluesky post (BLUESKY slice of PLATFORM_IMAGE_LIMITS). */
export const MAX_IMAGES = 4;

/** AT Protocol PDS host used for auth, blob upload, and record creation. */
export const BLUESKY_HOST = "https://bsky.social";

/** OAuth client metadata URL, used as the `client_id` per the AT Protocol
 * OAuth spec. Kept verbatim from the old provider/connect-url block. */
export const CLIENT_METADATA_URL =
  "https://delulu.social/oauth/bluesky-client.json";

/** OAuth redirect URI. Kept verbatim from the old callback route. */
export const CALLBACK_URL = "https://delulu.social/api/callback/bluesky";
