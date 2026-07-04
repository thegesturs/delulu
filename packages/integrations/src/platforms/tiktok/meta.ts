import type { PlatformMeta } from "../../types";

export const tiktokMeta: PlatformMeta = {
  name: "TikTok",
  icon: "tiktok",
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
