import type { PlatformIntegration } from "../../types";
import { linkedinAuth } from "./auth";
import { linkedinMeta } from "./meta";
import { linkedinRules } from "./rules";
import { linkedinSettings } from "./settings";

export const linkedinIntegration: PlatformIntegration = {
  id: "LINKEDIN",
  meta: linkedinMeta,
  auth: linkedinAuth,
  rules: linkedinRules,
  settings: linkedinSettings,
};
