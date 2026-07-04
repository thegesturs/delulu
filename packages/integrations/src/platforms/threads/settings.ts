import { DEFAULT_THREADS_SETTINGS } from "@delulu/validators/constants/settings";
import type { PlatformSettings } from "../../types";

export const threadsSettings: PlatformSettings = {
  defaults: DEFAULT_THREADS_SETTINGS,
  requiresConfiguration: false,
};
