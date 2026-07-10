import type { PlatformConnection } from "../../types";
import { facebookAuth } from "./auth";
import { facebookMeta } from "./meta";
import { facebookRules } from "./rules";
import { facebookSettings } from "./settings";

/**
 * Isomorphic (workerd-safe) Facebook connection. NOTE: no `publish` here — the
 * publisher lives in `./publish` (axios, Node-only) and is only referenced from
 * the worker publish-registry, so importing this never pulls axios into the CF
 * bundle. Facebook is `multiStepConnect` — the page picker is finalised by the
 * standalone `connectFacebookPage` export in `./auth`, not via `auth`.
 */
export const facebookConnection: PlatformConnection = {
  id: "FACEBOOK",
  meta: facebookMeta,
  auth: facebookAuth,
  rules: facebookRules,
  settings: facebookSettings,
};
