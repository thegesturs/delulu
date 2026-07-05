import type { PlatformMeta } from "../../types";

export const instagramMeta: PlatformMeta = {
  name: "Instagram",
  icon: "instagram",
  editor: "normal",
  capabilities: {
    publish: true,
    analytics: false,
    supportsDM: true,
    multiStepConnect: false,
    supportsThreads: false,
    supportsStories: true,
    supportsDocuments: false,
  },
};
