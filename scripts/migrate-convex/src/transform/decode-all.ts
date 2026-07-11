import {
  LEGACY_SCHEMAS,
  type LegacyAutomation,
  type LegacyAutomationContact,
  type LegacyAutomationLog,
  type LegacyMedia,
  type LegacyOrganization,
  type LegacyOrganizationMember,
  type LegacyPost,
  type LegacyPostReview,
  type LegacyReviewActivity,
  type LegacySocialProvider,
  type LegacySubscription,
  type LegacyTransaction,
  type LegacyTranscription,
  type LegacyUser,
} from "../legacy";
import { type DecodeIssue, decodeTable } from "../legacy/decode";
import type { Snapshot } from "../snapshot/reader";

export interface DecodedData {
  readonly users: readonly LegacyUser[];
  readonly organizations: readonly LegacyOrganization[];
  readonly organizationMembers: readonly LegacyOrganizationMember[];
  readonly socialProviders: readonly LegacySocialProvider[];
  readonly media: readonly LegacyMedia[];
  readonly posts: readonly LegacyPost[];
  readonly postReviews: readonly LegacyPostReview[];
  readonly reviewActivity: readonly LegacyReviewActivity[];
  readonly subscriptions: readonly LegacySubscription[];
  readonly transactions: readonly LegacyTransaction[];
  readonly automations: readonly LegacyAutomation[];
  readonly automationLogs: readonly LegacyAutomationLog[];
  readonly automationContacts: readonly LegacyAutomationContact[];
  readonly transcriptions: readonly LegacyTranscription[];
  readonly legacyUsersById: ReadonlyMap<string, LegacyUser>;
  readonly legacyUserIdByExternalId: ReadonlyMap<string, string>;
  readonly decodeErrors: readonly DecodeIssue[];
}

const decode = <A>(
  snapshot: Snapshot,
  table: string
): { ok: readonly A[]; errors: readonly DecodeIssue[] } => {
  const docs = snapshot.tables.get(table) ?? [];
  const schema = LEGACY_SCHEMAS[table];
  const result = decodeTable(schema, table, docs);
  return { ok: result.ok as readonly A[], errors: result.errors };
};

/** Decode every transform-input table, aggregating decode errors and building lookup indexes. */
export const decodeAll = (snapshot: Snapshot): DecodedData => {
  const errors: DecodeIssue[] = [];
  const take = <A>(table: string): readonly A[] => {
    const { ok, errors: tableErrors } = decode<A>(snapshot, table);
    errors.push(...tableErrors);
    return ok;
  };

  const users = take<LegacyUser>("users");
  const legacyUsersById = new Map<string, LegacyUser>();
  const legacyUserIdByExternalId = new Map<string, string>();
  for (const user of users) {
    legacyUsersById.set(user._id, user);
    if (user.externalId !== undefined && user.externalId !== "") {
      legacyUserIdByExternalId.set(user.externalId, user._id);
    }
  }

  return {
    users,
    organizations: take<LegacyOrganization>("organizations"),
    organizationMembers: take<LegacyOrganizationMember>("organizationMembers"),
    socialProviders: take<LegacySocialProvider>("socialProviders"),
    media: take<LegacyMedia>("media"),
    posts: take<LegacyPost>("posts"),
    postReviews: take<LegacyPostReview>("postReviews"),
    reviewActivity: take<LegacyReviewActivity>("reviewActivity"),
    subscriptions: take<LegacySubscription>("subscriptions"),
    transactions: take<LegacyTransaction>("transactions"),
    automations: take<LegacyAutomation>("automations"),
    automationLogs: take<LegacyAutomationLog>("automationLogs"),
    automationContacts: take<LegacyAutomationContact>("automationContacts"),
    transcriptions: take<LegacyTranscription>("transcriptions"),
    legacyUsersById,
    legacyUserIdByExternalId,
    decodeErrors: errors,
  };
};
