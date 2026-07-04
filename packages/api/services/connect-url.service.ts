import { getIntegration, type PublishableSocialType } from "@delulu/integrations";

export interface ConnectUrlOptions {
  includeInsights?: boolean;
}

export interface ConnectUrlProvider {
  connectUrl: (options?: ConnectUrlOptions) => string;
}

/**
 * Thin shim over the unified integration registry — the single source of truth
 * for OAuth connect URLs + scopes now lives in each platform's
 * `auth.getConnectUrl`. Kept for one release so `social-provider.ts` keeps
 * compiling; delete once callers import `getIntegration` directly.
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
        getIntegration(platform).auth.getConnectUrl({
          includeInsights: options?.includeInsights,
        }),
    } satisfies ConnectUrlProvider,
  ])
) as Record<PublishableSocialType, ConnectUrlProvider>;
