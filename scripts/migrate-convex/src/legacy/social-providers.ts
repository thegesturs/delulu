import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacySocialType = Schema.Literals([
  "TWITTER",
  "LINKEDIN",
  "LENS",
  "YOUTUBE",
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "THREADS",
  "PINTEREST",
  "FARCASTER",
  "BLUESKY",
  "DEFAULT",
]);
export type LegacySocialType = typeof LegacySocialType.Type;

export const LegacySocialProvider = Schema.Struct({
  ...SystemFields,
  organizationId: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  accessToken: Schema.String,
  refreshToken: Schema.optional(Schema.String),
  expiresIn: Schema.Number,
  refreshTokenExpiresIn: Schema.optional(Schema.Number),
  profileId: Schema.String,
  username: Schema.optional(Schema.String),
  fullName: Schema.String,
  profileImage: Schema.optional(Schema.String),
  socialType: LegacySocialType,
  updatedAt: Schema.optional(Schema.Number),
  isActive: Schema.Boolean,
  lastSyncedAt: Schema.optional(Schema.Number),
});
export type LegacySocialProvider = typeof LegacySocialProvider.Type;
