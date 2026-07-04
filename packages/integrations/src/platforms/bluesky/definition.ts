import type { PlatformIntegration } from "../../types";
import { blueskyAuth } from "./auth";
import { blueskyMeta } from "./meta";
import { blueskyRules } from "./rules";
import { blueskySettings } from "./settings";

export const blueskyIntegration: PlatformIntegration = {
  id: "BLUESKY",
  meta: blueskyMeta,
  auth: blueskyAuth,
  rules: blueskyRules,
  settings: blueskySettings,
};
