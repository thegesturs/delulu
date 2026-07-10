import type { PlatformConnection } from "../../types";
import { blueskyAuth } from "./auth";
import { blueskyMeta } from "./meta";
import { blueskyRules } from "./rules";
import { blueskySettings } from "./settings";

export const blueskyConnection: PlatformConnection = {
  id: "BLUESKY",
  meta: blueskyMeta,
  auth: blueskyAuth,
  rules: blueskyRules,
  settings: blueskySettings,
};
