import { DEFAULT_FACEBOOK_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

export const facebookSettings: PlatformSettings = {
  defaults: DEFAULT_FACEBOOK_SETTINGS,
  requiresConfiguration: false,
};
