import type { PlatformMeta } from "../../types";

export const threadsMeta: PlatformMeta = {
  name: "Threads",
  icon: "threads",
  editor: "normal",
  capabilities: {
    publish: true,
    analytics: false,
    supportsDM: false,
    multiStepConnect: false,
    supportsThreads: true,
    supportsStories: false,
    supportsDocuments: false,
  },
};
