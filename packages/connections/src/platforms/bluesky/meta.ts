import type { PlatformMeta } from "../../types";

export const blueskyMeta: PlatformMeta = {
  name: "Bluesky",
  icon: "bluesky",
  editor: "normal",
  capabilities: {
    publish: true,
    analytics: false,
    supportsDM: false,
    multiStepConnect: false,
    // The provider publishes each content item sequentially as a reply,
    // forming a thread — see `publish.ts`.
    supportsThreads: true,
    supportsStories: false,
    supportsDocuments: false,
  },
};
