export const PROVIDER = "TikTok";

/** TikTok caption/title limit (matches platform-rules TIKTOK). */
export const CAPTION_LIMIT = 2200;

/** Max characters TikTok accepts for the post title/caption field. */
export const TITLE_LIMIT = 150;

/** OAuth scopes requested on connect (matches connect-url.service TIKTOK). */
export const SCOPES =
  "user.info.basic,video.publish,video.upload,user.info.profile,video.list";

// ── API base URLs ──────────────────────────────────────────────────────────
export const OAUTH_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const USER_INFO_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username";
export const VIDEO_INIT_URL =
  "https://open.tiktokapis.com/v2/post/publish/video/init/";
export const STATUS_FETCH_URL =
  "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
export const VIDEO_LIST_URL =
  "https://open.tiktokapis.com/v2/video/list/?fields=id,create_time";
export const CREATOR_INFO_URL =
  "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
export const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";

// ── Polling ────────────────────────────────────────────────────────────────
export const POLL_MAX_ATTEMPTS = 30; // 5 minutes at 10s intervals
export const POLL_INTERVAL_MS = 10_000;
