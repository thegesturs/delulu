import type { PlatformMeta } from "../../types";

export const facebookMeta: PlatformMeta = {
  name: "Facebook",
  icon: "facebook",
  editor: "normal",
  capabilities: {
    publish: true,
    analytics: false,
    supportsDM: false,
    // Facebook is the multi-step (page-picker) connect: OAuth returns a list of
    // pages the user must choose from before a provider is upserted.
    multiStepConnect: true,
    supportsThreads: false,
    supportsStories: false,
    supportsDocuments: false,
  },
};
