import type { PlatformMeta } from "../../types";

export const youtubeMeta: PlatformMeta = {
  name: "YouTube",
  icon: "youtube",
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
