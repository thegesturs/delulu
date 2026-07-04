import type { PlatformMeta } from "../../types";

export const pinterestMeta: PlatformMeta = {
  name: "Pinterest",
  icon: "pinterest",
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
