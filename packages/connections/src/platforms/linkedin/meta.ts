import type { PlatformMeta } from "../../types";

export const linkedinMeta: PlatformMeta = {
  name: "LinkedIn",
  icon: "linkedin",
  editor: "normal",
  capabilities: {
    publish: true,
    analytics: false,
    supportsDM: false,
    multiStepConnect: false,
    supportsThreads: false,
    supportsStories: false,
    supportsDocuments: true,
  },
};
