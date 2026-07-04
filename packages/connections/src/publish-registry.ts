import type { PlatformPublisher, PublishableSocialType } from "./types";
import { blueskyPublisher } from "./platforms/bluesky/publish";
import { facebookPublisher } from "./platforms/facebook/publish";
import { farcasterPublisher } from "./platforms/farcaster/publish";
import { instagramPublisher } from "./platforms/instagram/publish";
import { linkedinPublisher } from "./platforms/linkedin/publish";
import { pinterestPublisher } from "./platforms/pinterest/publish";
import { threadsPublisher } from "./platforms/threads/publish";
import { tiktokPublisher } from "./platforms/tiktok/publish";
import { twitterPublisher } from "./platforms/twitter/publish";
import { youtubePublisher } from "./platforms/youtube/publish";

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
  TWITTER: twitterPublisher,
  THREADS: threadsPublisher,
  PINTEREST: pinterestPublisher,
  LINKEDIN: linkedinPublisher,
  TIKTOK: tiktokPublisher,
  BLUESKY: blueskyPublisher,
  FARCASTER: farcasterPublisher,
  YOUTUBE: youtubePublisher,
  FACEBOOK: facebookPublisher,
};

export function getPublisher(id: PublishableSocialType): PlatformPublisher {
  const publisher = publisherRegistry[id];
  if (!publisher) {
    throw new Error(`No publisher registered for "${id}"`);
  }
  return publisher;
}
