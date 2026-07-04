import type { PlatformIntegration } from "../../types";
import { tiktokAuth } from "./auth";
import { tiktokMeta } from "./meta";
import { tiktokQueries } from "./queries";
import { tiktokRules } from "./rules";
import { tiktokSettings } from "./settings";

/**
 * Isomorphic (workerd-safe) TikTok integration. NOTE: no `publish` here — the
 * publisher lives in `./publish` (axios) and is only referenced from the worker
 * publish-registry, so importing this never pulls axios into the CF bundle.
 */
export const tiktokIntegration: PlatformIntegration = {
  id: "TIKTOK",
  meta: tiktokMeta,
  auth: tiktokAuth,
  rules: tiktokRules,
  settings: tiktokSettings,
  queries: tiktokQueries,
};
