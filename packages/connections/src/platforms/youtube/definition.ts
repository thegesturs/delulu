import type { PlatformConnection } from "../../types";
import { youtubeAuth } from "./auth";
import { youtubeMeta } from "./meta";
import { youtubeRules } from "./rules";
import { youtubeSettings } from "./settings";

/** Public connection metadata; upload execution lives in the worker registry. */
export const youtubeConnection: PlatformConnection = {
  id: "YOUTUBE",
  meta: youtubeMeta,
  auth: youtubeAuth,
  rules: youtubeRules,
  settings: youtubeSettings,
};
