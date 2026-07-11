import type { Schema } from "effect";
import {
  LegacyAutomation,
  LegacyAutomationContact,
  LegacyAutomationLog,
} from "./automations";
import { LegacyMedia } from "./media";
import { LegacyOrganization, LegacyOrganizationMember } from "./organizations";
import { LegacyPost } from "./posts";
import { LegacyPostReview, LegacyReviewActivity } from "./reviews";
import { LegacySocialProvider } from "./social-providers";
import { LegacySubscription, LegacyTransaction } from "./subscriptions";
import { LegacyTranscription } from "./transcriptions";
import { LegacyUser } from "./users";

export * from "./automations";
export * from "./common";
export * from "./media";
export * from "./organizations";
export * from "./posts";
export * from "./reviews";
export * from "./social-providers";
export * from "./subscriptions";
export * from "./transcriptions";
export * from "./users";

/**
 * Registry of Convex table name → legacy schema, used by `inspect` and the
 * transform loaders to decode raw documents. Only tables that are migrated or
 * transformed appear here; dropped/rebuilt tables have no schema.
 */
export const LEGACY_SCHEMAS: Readonly<Record<string, Schema.Codec<unknown>>> = {
  users: LegacyUser,
  organizations: LegacyOrganization,
  organizationMembers: LegacyOrganizationMember,
  socialProviders: LegacySocialProvider,
  media: LegacyMedia,
  posts: LegacyPost,
  postReviews: LegacyPostReview,
  reviewActivity: LegacyReviewActivity,
  subscriptions: LegacySubscription,
  transactions: LegacyTransaction,
  automations: LegacyAutomation,
  automationLogs: LegacyAutomationLog,
  automationContacts: LegacyAutomationContact,
  transcriptions: LegacyTranscription,
};
