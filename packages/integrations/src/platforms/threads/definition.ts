import type { PlatformIntegration } from "../../types";
import { threadsAuth } from "./auth";
import { threadsMeta } from "./meta";
import { threadsRules } from "./rules";
import { threadsSettings } from "./settings";

export const threadsIntegration: PlatformIntegration = {
  id: "THREADS",
  meta: threadsMeta,
  auth: threadsAuth,
  rules: threadsRules,
  settings: threadsSettings,
};
