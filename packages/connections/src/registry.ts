import type {
  PlatformConnection,
  PlatformMediaRules,
  PublishableSocialType,
} from "./types";
import { blueskyConnection } from "./platforms/bluesky/definition";
import { facebookConnection } from "./platforms/facebook/definition";
import { farcasterConnection } from "./platforms/farcaster/definition";
import { instagramConnection } from "./platforms/instagram/definition";
import { linkedinConnection } from "./platforms/linkedin/definition";
import { pinterestConnection } from "./platforms/pinterest/definition";
import { threadsConnection } from "./platforms/threads/definition";
import { tiktokConnection } from "./platforms/tiktok/definition";
import { twitterConnection } from "./platforms/twitter/definition";
import { youtubeConnection } from "./platforms/youtube/definition";

/**
 * Isomorphic metadata registry — the single source of truth for meta, auth,
 * rules, settings, webhooks and queries. Deliberately excludes `publish`
 * (see `publish-registry.ts`). `Partial` while platforms are migrated in
 * Phase 2; `getConnection` throws for anything not yet registered.
 */
export const connectionRegistry: Partial<
  Record<PublishableSocialType, PlatformConnection>
> = {
  INSTAGRAM: instagramConnection,
  TWITTER: twitterConnection,
  THREADS: threadsConnection,
  PINTEREST: pinterestConnection,
  LINKEDIN: linkedinConnection,
  TIKTOK: tiktokConnection,
  BLUESKY: blueskyConnection,
  FARCASTER: farcasterConnection,
  YOUTUBE: youtubeConnection,
  FACEBOOK: facebookConnection,
};

export function getConnection(id: PublishableSocialType): PlatformConnection {
  const connection = connectionRegistry[id];
  if (!connection) {
    throw new Error(`No connection registered for "${id}"`);
  }
  return connection;
}

export function listConnections(): PlatformConnection[] {
  return Object.values(connectionRegistry).filter(
    (i): i is PlatformConnection => i !== undefined
  );
}

export function listPublishable(): PlatformConnection[] {
  return listConnections().filter((i) => i.meta.capabilities.publish);
}

export function getAllMediaRules(): Partial<
  Record<PublishableSocialType, PlatformMediaRules>
> {
  const out: Partial<Record<PublishableSocialType, PlatformMediaRules>> = {};
  for (const connection of listConnections()) {
    out[connection.id] = connection.rules.media;
  }
  return out;
}

export function getAllCharacterLimits(): Partial<
  Record<PublishableSocialType, number | undefined>
> {
  const out: Partial<Record<PublishableSocialType, number | undefined>> = {};
  for (const connection of listConnections()) {
    out[connection.id] = connection.rules.maxLength;
  }
  return out;
}
