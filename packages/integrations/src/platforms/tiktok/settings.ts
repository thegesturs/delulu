import { DEFAULT_TIKTOK_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

/**
 * TikTok requires settings (privacy level from the creator API) to be configured
 * before posting — see PLATFORMS_WITH_REQUIRED_SETTINGS in the validators.
 */
export const tiktokSettings: PlatformSettings = {
  defaults: DEFAULT_TIKTOK_SETTINGS,
  requiresConfiguration: true,
};
