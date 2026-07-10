/** Display name used in error messages + logs. */
export const PROVIDER = "Twitter";

/** X/Twitter character limit per tweet. */
export const CHAR_LIMIT = 280;

/** Max images X accepts per tweet. */
export const MAX_IMAGES = 4;

/**
 * OAuth2 scopes — ported verbatim from the connect-url service /
 * twitter.provider. `offline.access` is what grants a refresh token.
 */
export const SCOPES = [
  "users.read",
  "tweet.read",
  "offline.access",
  "tweet.write",
  "media.write",
];
