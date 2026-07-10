import type { PlatformConnection } from "../../types";
import { threadsAuth } from "./auth";
import { threadsMeta } from "./meta";
import { threadsRules } from "./rules";
import { threadsSettings } from "./settings";

export const threadsConnection: PlatformConnection = {
  id: "THREADS",
  meta: threadsMeta,
  auth: threadsAuth,
  rules: threadsRules,
  settings: threadsSettings,
};
