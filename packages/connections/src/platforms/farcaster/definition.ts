import type { PlatformConnection } from "../../types";
import { farcasterAuth } from "./auth";
import { farcasterMeta } from "./meta";
import { farcasterRules } from "./rules";
import { farcasterSettings } from "./settings";

export const farcasterConnection: PlatformConnection = {
  id: "FARCASTER",
  meta: farcasterMeta,
  auth: farcasterAuth,
  rules: farcasterRules,
  settings: farcasterSettings,
};
