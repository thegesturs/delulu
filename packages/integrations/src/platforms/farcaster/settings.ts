import { DEFAULT_FARCASTER_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

export const farcasterSettings: PlatformSettings = {
  defaults: DEFAULT_FARCASTER_SETTINGS,
  requiresConfiguration: false,
};
