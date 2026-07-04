import { DEFAULT_BLUESKY_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

export const blueskySettings: PlatformSettings = {
  defaults: DEFAULT_BLUESKY_SETTINGS,
  requiresConfiguration: false,
};
