import { DEFAULT_YOUTUBE_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

export const youtubeSettings: PlatformSettings = {
  defaults: DEFAULT_YOUTUBE_SETTINGS,
  requiresConfiguration: false,
};
