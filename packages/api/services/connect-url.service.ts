import { getConnection, type PublishableSocialType } from "@delulu/connections";

export interface ConnectUrlOptions {
  includeInsights?: boolean;
}

export interface ConnectUrlProvider {
  connectUrl: (options?: ConnectUrlOptions) => string;
}

/**
 * Thin shim over the unified connection registry — the single source of truth
 * for OAuth connect URLs + scopes now lives in each platform's
 * `auth.getConnectUrl`. Kept for one release so `social-provider.ts` keeps
 * compiling; delete once callers import `getConnection` directly.
 */
const PLATFORMS: PublishableSocialType[] = [
  "TWITTER",
  "LINKEDIN",
  "TIKTOK",
  "INSTAGRAM",
  "THREADS",
  "FACEBOOK",
  "PINTEREST",
  "FARCASTER",
  "YOUTUBE",
  "BLUESKY",
];

export const connectUrlRegistry = Object.fromEntries(
  PLATFORMS.map((platform) => [
    platform,
    {
      connectUrl: (options?: ConnectUrlOptions) =>
        getConnection(platform).auth.getConnectUrl({
          includeInsights: options?.includeInsights,
        }),
    } satisfies ConnectUrlProvider,
  ])
) as Record<PublishableSocialType, ConnectUrlProvider>;
