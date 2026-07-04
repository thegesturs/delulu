import type { PlatformIntegration } from "../../types";
import { twitterAuth } from "./auth";
import { twitterMeta } from "./meta";
import { twitterRules } from "./rules";
import { twitterSettings } from "./settings";

export const twitterIntegration: PlatformIntegration = {
  id: "TWITTER",
  meta: twitterMeta,
  auth: twitterAuth,
  rules: twitterRules,
  settings: twitterSettings,
};
