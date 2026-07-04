export const PROVIDER = "YouTube";

/** Description/caption limit surfaced to the editor (matches platform-rules). */
export const MAX_LENGTH = 5000;

/** Max upload size accepted before we reject fetching the video (2GB). */
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

/** Publish-time video rules (ported from PLATFORM_VIDEO_RULES.YOUTUBE). */
export const VIDEO_RULES = {
  minDuration: 1,
  maxDuration: 43_200, // 12 hours
  maxFileSize: MAX_FILE_SIZE,
  allowedFormats: ["video/mp4", "video/quicktime", "video/webm"] as const,
};

/** OAuth scopes required for upload + channel read + profile. */
export const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
];
