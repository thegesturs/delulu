/**
 * Default `PlatformSettings` per platform. Reproduced from
 * `packages/client/src/post-write.ts` (`settingsFor` is not exported and the
 * client is a browser bundle); the migrator stays dependency-light and
 * self-contained so it survives Convex-package deletion. Keep in sync with the
 * `PlatformSettings` union in `packages/core/src/domain/post-target.ts`.
 */
export interface PlatformSettingsValue {
  readonly platform: string;
  readonly values: Record<string, unknown>;
}

export class UnsupportedPlatformError extends Error {
  constructor(platform: string) {
    super(`Unsupported connection platform for settings: ${platform}`);
    this.name = "UnsupportedPlatformError";
  }
}

export const settingsFor = (
  platform: string,
  privacy?: string
): PlatformSettingsValue => {
  switch (platform.toUpperCase()) {
    case "BLUESKY":
      return { platform: "BLUESKY", values: {} };
    case "FACEBOOK":
      return {
        platform: "FACEBOOK",
        values: {
          privacy:
            privacy === "FRIENDS" || privacy === "ONLY_ME" ? privacy : "PUBLIC",
        },
      };
    case "FARCASTER":
      return { platform: "FARCASTER", values: {} };
    case "INSTAGRAM":
      return {
        platform: "INSTAGRAM",
        values: {
          shareToFeed: true,
          shareToStory: false,
          trialReels: false,
          graduationStrategy: "MANUAL",
        },
      };
    case "LINKEDIN":
      return {
        platform: "LINKEDIN",
        values: { visibility: privacy === "CONNECTIONS" ? privacy : "PUBLIC" },
      };
    case "PINTEREST":
      return { platform: "PINTEREST", values: {} };
    case "THREADS":
      return { platform: "THREADS", values: { replyControl: "everyone" } };
    case "TIKTOK":
      return {
        platform: "TIKTOK",
        values: {
          privacy:
            privacy === "MUTUAL_FOLLOW_FRIENDS" ||
            privacy === "FOLLOWER_OF_CREATOR" ||
            privacy === "SELF_ONLY"
              ? privacy
              : "PUBLIC_TO_EVERYONE",
          allowComments: true,
          allowDuet: true,
          allowStitch: true,
          promotionContent: "NONE",
        },
      };
    case "TWITTER":
      return { platform: "TWITTER", values: { replyRestriction: "everyone" } };
    case "YOUTUBE":
      return {
        platform: "YOUTUBE",
        values: {
          privacy:
            privacy === "PRIVATE" || privacy === "UNLISTED"
              ? privacy
              : "PUBLIC",
          madeForKids: false,
        },
      };
    default:
      throw new UnsupportedPlatformError(platform);
  }
};

/** Map legacy TikTok settings onto the new TikTok `PlatformSettings` values. */
export const tiktokSettingsFrom = (settings: {
  readonly privacy: string;
  readonly allowComments: boolean;
  readonly allowDuet: boolean;
  readonly allowStitch: boolean;
  readonly promotionContent: string;
}): PlatformSettingsValue => ({
  platform: "TIKTOK",
  values: {
    privacy: settings.privacy,
    allowComments: settings.allowComments,
    allowDuet: settings.allowDuet,
    allowStitch: settings.allowStitch,
    promotionContent: settings.promotionContent,
  },
});
