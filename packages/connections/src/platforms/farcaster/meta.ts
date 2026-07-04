import type { PlatformMeta } from "../../types";

export const farcasterMeta: PlatformMeta = {
  name: "Farcaster",
  icon: "farcaster",
  editor: "normal",
  capabilities: {
    publish: true,
    analytics: false,
    supportsDM: false,
    multiStepConnect: false,
    supportsThreads: false,
    supportsStories: false,
    supportsDocuments: false,
  },
};
