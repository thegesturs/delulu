/**
 * Insert-row shapes for every migrated table. Keys are camelCase and map to
 * snake_case columns via the PgClient `transformQueryNames`. JSONB columns are
 * carried as pre-stringified JSON strings (not JS objects) so node-pg does not
 * turn top-level arrays into Postgres array literals — matching how the domain
 * services insert JSON (`packages/services/src/posts.ts`).
 */

export type Json = string;

export interface UserRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly externalId: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly imageUrl: string | null;
  readonly monthlyPosts: number;
  readonly monthlyPostsPeriodStart: Date | null;
  readonly dmsSent: number;
  readonly dmsSentPeriodStart: Date | null;
  readonly transcriptionsUsed: number;
  readonly transcriptionsPeriodStart: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkspaceRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly name: string;
  readonly slug: string | null;
  readonly billingOwnerUserId: string;
  readonly parentOrgId: string | null;
  readonly clerkOrgId: string | null;
  readonly isPersonal: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MemberRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly userId: string;
  readonly role: "owner" | "admin" | "editor" | "viewer";
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ConnectionRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly platform: string;
  readonly profileId: string;
  readonly username: string | null;
  readonly displayName: string | null;
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly cipherVersion: "v1";
  readonly expiresAt: Date | null;
  readonly metadata: Json;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MediaRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly bucketKey: string;
  readonly url: string;
  readonly mediaType: "image" | "video" | "document";
  readonly mimeType: string | null;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly durationSeconds: number | null;
  readonly thumbnails: Json;
  readonly altText: string | null;
  readonly status: "pending" | "ready" | "failed";
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PostRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly status: string;
  readonly content: Json;
  readonly createdByMemberId: string;
  readonly source: "app" | "api" | "automation";
  readonly externalSubmissionId: string | null;
  readonly deletedAt: Date | null;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PostTargetRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly postId: string;
  readonly connectionId: string;
  readonly groupId: string;
  readonly settings: Json;
  readonly scheduledAt: Date | null;
  readonly status: "pending" | "publishing" | "published" | "failed";
  readonly platformPostId: string | null;
  readonly platformPostUrl: string | null;
  readonly postedAt: Date | null;
  readonly error: string | null;
  readonly attempts: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface JobRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly payload: Json;
  readonly runAt: Date;
  readonly status: "pending";
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lockedUntil: Date | null;
  readonly lastError: string | null;
  readonly idempotencyKey: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PostReviewRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly postId: string;
  readonly status: "pending" | "approved" | "rejected";
  readonly contentFingerprint: string;
  readonly submittedByMemberId: string;
  readonly resolvedByMemberId: string | null;
  readonly resolvedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ReviewActivityRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly postId: string;
  readonly reviewId: string | null;
  readonly actorMemberId: string;
  readonly activityType: string;
  readonly comment: string | null;
  readonly metadata: Json;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SubscriptionRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly billingOwnerUserId: string;
  readonly providerCustomerId: string | null;
  readonly providerSubscriptionId: string | null;
  readonly plan: string;
  readonly status: string;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly monthlyPosts: number;
  readonly mediaStorageBytes: number;
  readonly dmsSent: number;
  readonly dmsSkipped: number;
  readonly transcriptionsUsed: number;
  readonly transcriptionsPeriodStart: Date | null;
  readonly dmsSentPeriodStart: Date | null;
  readonly dmsReserved: number;
  readonly socialAccounts: number;
  readonly apiRequestsPerMonth: number;
  readonly apiRequestsPeriodStart: Date | null;
  readonly seatQuantity: number | null;
  readonly unitPriceMinor: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SubscriptionAddonRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly baseSubscriptionId: string;
  readonly addonKey: string;
  readonly providerSubscriptionId: string | null;
  readonly status: string;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly providerUpdatedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TransactionRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly billingOwnerUserId: string;
  readonly providerTransactionId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: string;
  readonly metadata: Json;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AutomationRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly platform: string;
  readonly category: string;
  readonly triggerConfig: Json;
  readonly enabled: boolean;
  readonly name: string;
  readonly description: string | null;
  readonly triggers: Json;
  readonly steps: Json;
  readonly notes: Json;
  readonly nodePositions: Json;
  readonly totalTriggered: number;
  readonly totalDmsSent: number;
  readonly totalFailed: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AutomationRunRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly automationId: string;
  readonly status: string;
  readonly input: Json;
  readonly output: Json;
  readonly error: string | null;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AutomationContactRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly automationId: string;
  readonly platformUserId: string;
  readonly email: string | null;
  readonly metadata: Json;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TranscriptionRow {
  readonly id: string;
  readonly legacyConvexId: string | null;
  readonly workspaceId: string;
  readonly mediaId: string | null;
  readonly reelId: string | null;
  readonly reelUrl: string | null;
  readonly text: string;
  readonly altText: string | null;
  readonly language: string | null;
  readonly durationSeconds: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Every row set produced by the transform, loaded in dependency order. */
export interface LoadSet {
  users: UserRow[];
  workspaces: WorkspaceRow[];
  workspaceMembers: MemberRow[];
  connections: ConnectionRow[];
  media: MediaRow[];
  posts: PostRow[];
  postTargets: PostTargetRow[];
  jobs: JobRow[];
  postReviews: PostReviewRow[];
  reviewActivity: ReviewActivityRow[];
  subscriptions: SubscriptionRow[];
  subscriptionAddons: SubscriptionAddonRow[];
  transactions: TransactionRow[];
  automations: AutomationRow[];
  automationRuns: AutomationRunRow[];
  automationContacts: AutomationContactRow[];
  transcriptions: TranscriptionRow[];
}

export const emptyLoadSet = (): LoadSet => ({
  users: [],
  workspaces: [],
  workspaceMembers: [],
  connections: [],
  media: [],
  posts: [],
  postTargets: [],
  jobs: [],
  postReviews: [],
  reviewActivity: [],
  subscriptions: [],
  subscriptionAddons: [],
  transactions: [],
  automations: [],
  automationRuns: [],
  automationContacts: [],
  transcriptions: [],
});

export interface RoleAuditRow {
  readonly org: string;
  readonly email: string;
  readonly legacyRole: string;
  readonly isCreator: boolean;
  readonly newRole: string;
  readonly anomaly: string | null;
}

export interface OwnershipAuditRow {
  readonly entity: string;
  readonly legacyId: string;
  readonly kind: "org" | "user";
  readonly workspaceId: string;
  readonly resolvedVia: string;
}
