import type { PlatformConnection } from "../../types";
import { twitterAuth } from "./auth";
import { twitterMeta } from "./meta";
import { twitterRules } from "./rules";
import { twitterSettings } from "./settings";

export const twitterConnection: PlatformConnection = {
  id: "TWITTER",
  meta: twitterMeta,
  auth: twitterAuth,
  rules: twitterRules,
  settings: twitterSettings,
};
