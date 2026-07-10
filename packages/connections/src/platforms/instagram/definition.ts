import type { PlatformConnection } from "../../types";
import { instagramAuth } from "./auth";
import { instagramMeta } from "./meta";
import { instagramQueries } from "./queries";
import { instagramRules } from "./rules";
import { instagramSettings } from "./settings";
import { instagramWebhooks } from "./webhooks";

/**
 * Isomorphic (workerd-safe) Instagram connection. NOTE: no `publish` here —
 * the publisher lives in `./publish` and is only referenced from the worker
 * publish-registry, so importing this never pulls axios into the CF bundle.
 */
export const instagramConnection: PlatformConnection = {
  id: "INSTAGRAM",
  meta: instagramMeta,
  auth: instagramAuth,
  rules: instagramRules,
  settings: instagramSettings,
  webhooks: instagramWebhooks,
  queries: instagramQueries,
};
