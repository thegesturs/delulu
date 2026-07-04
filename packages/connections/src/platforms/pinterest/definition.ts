import type { PlatformConnection } from "../../types";
import { pinterestAuth } from "./auth";
import { pinterestMeta } from "./meta";
import { pinterestRules } from "./rules";
import { pinterestSettings } from "./settings";

export const pinterestConnection: PlatformConnection = {
  id: "PINTEREST",
  meta: pinterestMeta,
  auth: pinterestAuth,
  rules: pinterestRules,
  settings: pinterestSettings,
};
