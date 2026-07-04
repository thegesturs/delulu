import type { PlatformIntegration } from "../../types";
import { instagramAuth } from "./auth";
import { instagramMeta } from "./meta";
import { instagramQueries } from "./queries";
import { instagramRules } from "./rules";
import { instagramSettings } from "./settings";
import { instagramWebhooks } from "./webhooks";

/**
 * Isomorphic (workerd-safe) Instagram integration. NOTE: no `publish` here —
 * the publisher lives in `./publish` and is only referenced from the worker
 * publish-registry, so importing this never pulls axios into the CF bundle.
 */
export const instagramIntegration: PlatformIntegration = {
  id: "INSTAGRAM",
  meta: instagramMeta,
  auth: instagramAuth,
  rules: instagramRules,
  settings: instagramSettings,
  webhooks: instagramWebhooks,
  queries: instagramQueries,
};
