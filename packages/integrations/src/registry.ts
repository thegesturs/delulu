import type {
  PlatformIntegration,
  PlatformMediaRules,
  PublishableSocialType,
} from "./types";
import { blueskyIntegration } from "./platforms/bluesky/definition";
import { facebookIntegration } from "./platforms/facebook/definition";
import { farcasterIntegration } from "./platforms/farcaster/definition";
import { instagramIntegration } from "./platforms/instagram/definition";
import { linkedinIntegration } from "./platforms/linkedin/definition";
import { pinterestIntegration } from "./platforms/pinterest/definition";
import { threadsIntegration } from "./platforms/threads/definition";
import { tiktokIntegration } from "./platforms/tiktok/definition";
import { twitterIntegration } from "./platforms/twitter/definition";
import { youtubeIntegration } from "./platforms/youtube/definition";

/**
 * Isomorphic metadata registry — the single source of truth for meta, auth,
 * rules, settings, webhooks and queries. Deliberately excludes `publish`
 * (see `publish-registry.ts`). `Partial` while platforms are migrated in
 * Phase 2; `getIntegration` throws for anything not yet registered.
 */
export const integrationRegistry: Partial<
  Record<PublishableSocialType, PlatformIntegration>
> = {
  INSTAGRAM: instagramIntegration,
  TWITTER: twitterIntegration,
  THREADS: threadsIntegration,
  PINTEREST: pinterestIntegration,
  LINKEDIN: linkedinIntegration,
  TIKTOK: tiktokIntegration,
  BLUESKY: blueskyIntegration,
  FARCASTER: farcasterIntegration,
  YOUTUBE: youtubeIntegration,
  FACEBOOK: facebookIntegration,
};

export function getIntegration(id: PublishableSocialType): PlatformIntegration {
  const integration = integrationRegistry[id];
  if (!integration) {
    throw new Error(`No integration registered for "${id}"`);
  }
  return integration;
}

export function listIntegrations(): PlatformIntegration[] {
  return Object.values(integrationRegistry).filter(
    (i): i is PlatformIntegration => i !== undefined
  );
}

export function listPublishable(): PlatformIntegration[] {
  return listIntegrations().filter((i) => i.meta.capabilities.publish);
}

export function getAllMediaRules(): Partial<
  Record<PublishableSocialType, PlatformMediaRules>
> {
  const out: Partial<Record<PublishableSocialType, PlatformMediaRules>> = {};
  for (const integration of listIntegrations()) {
    out[integration.id] = integration.rules.media;
  }
  return out;
}

export function getAllCharacterLimits(): Partial<
  Record<PublishableSocialType, number | undefined>
> {
  const out: Partial<Record<PublishableSocialType, number | undefined>> = {};
  for (const integration of listIntegrations()) {
    out[integration.id] = integration.rules.maxLength;
  }
  return out;
}
