import type { PlatformIntegration } from "../../types";
import { farcasterAuth } from "./auth";
import { farcasterMeta } from "./meta";
import { farcasterRules } from "./rules";
import { farcasterSettings } from "./settings";

export const farcasterIntegration: PlatformIntegration = {
  id: "FARCASTER",
  meta: farcasterMeta,
  auth: farcasterAuth,
  rules: farcasterRules,
  settings: farcasterSettings,
};
