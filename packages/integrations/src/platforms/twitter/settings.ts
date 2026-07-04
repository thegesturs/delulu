import { DEFAULT_TWITTER_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

export const twitterSettings: PlatformSettings = {
  defaults: DEFAULT_TWITTER_SETTINGS,
  requiresConfiguration: false,
};
