import { PostWrite } from "@delulu/contracts";
import { Schema } from "effect";
import { nanoid } from "nanoid";

export interface SimplePostConnection {
  readonly id: string;
  readonly platform: string;
}

export interface SimplePostInput {
  readonly caption: string;
  readonly connections: readonly SimplePostConnection[];
  readonly mediaIds?: readonly string[];
  readonly scheduledAt?: string | null;
  readonly privacy?: string;
}

const settingsFor = (platform: string, privacy?: string) => {
  switch (platform.toUpperCase()) {
    case "BLUESKY":
      return { platform: "BLUESKY", values: {} } as const;
    case "FACEBOOK":
      return {
        platform: "FACEBOOK",
        values: {
          privacy:
            privacy === "FRIENDS" || privacy === "ONLY_ME" ? privacy : "PUBLIC",
        },
      } as const;
    case "FARCASTER":
      return { platform: "FARCASTER", values: {} } as const;
    case "INSTAGRAM":
      return {
        platform: "INSTAGRAM",
        values: {
          shareToFeed: true,
          shareToStory: false,
          trialReels: false,
          graduationStrategy: "MANUAL",
        },
      } as const;
    case "LINKEDIN":
      return {
        platform: "LINKEDIN",
        values: { visibility: privacy === "CONNECTIONS" ? privacy : "PUBLIC" },
      } as const;
    case "PINTEREST":
      return { platform: "PINTEREST", values: {} } as const;
    case "THREADS":
      return {
        platform: "THREADS",
        values: { replyControl: "everyone" },
      } as const;
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
      } as const;
    case "TWITTER":
      return {
        platform: "TWITTER",
        values: { replyRestriction: "everyone" },
      } as const;
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
      } as const;
    default:
      throw new Error(`Unsupported connection platform: ${platform}`);
  }
};

export const makeSimplePostWrite = (
  input: SimplePostInput
): typeof PostWrite.Type => {
  const groupId = `post_group_${nanoid()}`;
  return Schema.decodeUnknownSync(PostWrite)({
    groups: [
      {
        id: groupId,
        isDefault: true,
        segments: [
          {
            text: input.caption,
            media: (input.mediaIds ?? []).map((id) => ({ id })),
          },
        ],
      },
    ],
    targets: input.connections.map((connection) => ({
      connectionId: connection.id,
      groupId,
      settings: settingsFor(connection.platform, input.privacy),
      scheduledAt: input.scheduledAt ?? null,
    })),
    source: "api",
  });
};
