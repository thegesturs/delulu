import type { PlatformPublisher, PublishableSocialType } from "./types";
import { instagramPublisher } from "./platforms/instagram/publish";

/**
 * Node-only publish registry. Imports the concrete `publish` modules
 * (axios/googleapis) and is ONLY reachable through `worker-entry.ts` — never
 * from `index.ts`. This is the Path A boundary that keeps the Cloudflare
 * bundle free of Node-only publishing code.
 */
export const publisherRegistry: Partial<
  Record<PublishableSocialType, PlatformPublisher>
> = {
  INSTAGRAM: instagramPublisher,
};

export function getPublisher(id: PublishableSocialType): PlatformPublisher {
  const publisher = publisherRegistry[id];
  if (!publisher) {
    throw new Error(`No publisher registered for "${id}"`);
  }
  return publisher;
}
