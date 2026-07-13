/** Edge-case tallies surfaced in the run manifest and report (spec §4.6). */
export class Counters {
  private readonly map = new Map<string, number>();

  bump(key: string, amount = 1): void {
    this.map.set(key, (this.map.get(key) ?? 0) + amount);
  }

  get(key: string): number {
    return this.map.get(key) ?? 0;
  }

  toRecord(): Record<string, number> {
    return Object.fromEntries([...this.map.entries()].sort());
  }
}

/** Canonical counter keys (documented once so the report stays stable). */
export const COUNTER = {
  usersMissingExternalId: "users.missingExternalId",
  workspacesPersonalSynthesized: "workspaces.personalSynthesized",
  workspacesSlugNulled: "workspaces.slugNulledDuplicate",
  membersSynthesizedOwner: "members.synthesizedOwnerForCreator",
  membersFallbackOwner: "members.workspaceOwnerFallback",
  connectionsExpiresNulled: "connections.expiresNulled",
  connectionsSameOwnerDupeDropped: "connections.sameOwnerDuplicateDropped",
  mediaSynthesizedUnresolved: "media.synthesizedUnresolvedRef",
  mediaSynthesizedCrossWorkspace: "media.synthesizedCrossWorkspaceCopy",
  postsTitlePrepended: "posts.titlePrependedUnpublished",
  postsTitleDropped: "posts.titleDroppedPublished",
  postsTagsDropped: "posts.tagsDropped",
  postsEmptyContent: "posts.emptyContentSynthesized",
  postsDuplicateSubmissionDropped: "posts.duplicateExternalSubmissionDropped",
  postsDroppedDeletedOrg: "posts.droppedDeletedOrg",
  altContentDistinct: "posts.alternativeContentDistinctGroups",
  altContentCollapsed: "posts.alternativeContentCollapsed",
  targetsPrunedUnknownProvider: "targets.prunedUnknownProvider",
  targetsPublishedWithoutPlatformRecord:
    "targets.publishedWithoutPlatformRecord",
  targetsProcessingInterrupted: "targets.processingInterrupted",
  targetsSettingsTikTokFallback: "targets.settingsTikTokFallback",
  targetsSettingsSynthesizedDefault: "targets.settingsSynthesizedDefault",
  jobsEmitted: "jobs.publishTargetEmitted",
  reviewsCollapsedDuplicate: "reviews.collapsedDuplicatePerPost",
  reviewsSynthesizedRejectedActivity: "reviews.synthesizedRejectedActivity",
  reviewMemberFallback: "reviews.memberFallback",
  subscriptionsFreeSynthesized: "subscriptions.freeSynthesized",
  subscriptionsHistoricalDropped: "subscriptions.historicalRowsDropped",
  transactionsDuplicateDropped: "transactions.duplicatePaymentDropped",
  automationsPlaceholderCreated: "automations.placeholderForContactsCreated",
  automationPendingPostDropped: "automations.pendingPostIdDropped",
  contactsAttachedToOldest: "contacts.attachedToOldestAutomation",
  contactsAttachedToPlaceholder: "contacts.attachedToPlaceholder",
  contactsDuplicateDropped: "contacts.duplicateDropped",
} as const;
