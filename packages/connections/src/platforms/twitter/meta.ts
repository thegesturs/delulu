import type { PlatformMeta } from "../../types";

export const twitterMeta: PlatformMeta = {
  name: "Twitter",
  icon: "twitter",
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
