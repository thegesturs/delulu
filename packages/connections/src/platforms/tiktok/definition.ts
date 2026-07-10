import type { PlatformConnection } from "../../types";
import { tiktokAuth } from "./auth";
import { tiktokMeta } from "./meta";
import { tiktokQueries } from "./queries";
import { tiktokRules } from "./rules";
import { tiktokSettings } from "./settings";

/**
 * Isomorphic (workerd-safe) TikTok connection. NOTE: no `publish` here — the
 * publisher lives in `./publish` (axios) and is only referenced from the worker
 * publish-registry, so importing this never pulls axios into the CF bundle.
 */
export const tiktokConnection: PlatformConnection = {
  id: "TIKTOK",
  meta: tiktokMeta,
  auth: tiktokAuth,
  rules: tiktokRules,
  settings: tiktokSettings,
  queries: tiktokQueries,
};
