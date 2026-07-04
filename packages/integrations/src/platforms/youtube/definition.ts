import type { PlatformIntegration } from "../../types";
import { youtubeAuth } from "./auth";
import { youtubeMeta } from "./meta";
import { youtubeRules } from "./rules";
import { youtubeSettings } from "./settings";

/**
 * Isomorphic (workerd-safe) YouTube integration. NOTE: no `publish` here — the
 * publisher lives in `./publish` (Node-only: `googleapis` + `node:https`) and is
 * referenced only from the worker publish-registry, so importing this never
 * pulls googleapis into the CF bundle.
 */
export const youtubeIntegration: PlatformIntegration = {
  id: "YOUTUBE",
  meta: youtubeMeta,
  auth: youtubeAuth,
  rules: youtubeRules,
  settings: youtubeSettings,
};
