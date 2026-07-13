import {
  AutomationContactId,
  AutomationId,
  AutomationRunId,
  makeId,
} from "@delulu/core";
import { epochToDateOr } from "../idmap";
import type {
  LegacyAutomation,
  LegacyAutomationContact,
  LegacyAutomationLog,
  LegacyTriggerStep,
} from "../legacy";
import type { TransformContext } from "./context";
import { COUNTER } from "./counters";
import { computeWorkspace, recordOwnership } from "./ownership";
import type { AutomationContactRow } from "./types";

const lowerTrigger = (type: LegacyTriggerStep["triggerType"]): string =>
  type.toLowerCase();

const mapTriggers = (
  ctx: TransformContext,
  triggers: readonly LegacyTriggerStep[]
): unknown[] =>
  triggers.map((trigger) => {
    const pending: string[] = [];
    for (const legacyPostId of trigger.pendingPostIds ?? []) {
      const newId = ctx.ids.posts.get(legacyPostId);
      if (newId === undefined) {
        ctx.counters.bump(COUNTER.automationPendingPostDropped);
      } else {
        pending.push(newId);
      }
    }
    const mapped: Record<string, unknown> = {
      id: trigger.id,
      type: "trigger",
      triggerType: lowerTrigger(trigger.triggerType),
      targetPostIds: trigger.targetPostIds,
    };
    if (trigger.pendingPostIds !== undefined) {
      mapped.pendingPostIds = pending;
    }
    if (trigger.keywordFilter !== undefined) {
      mapped.keywordFilter = trigger.keywordFilter;
    }
    if (trigger.commentReply !== undefined) {
      mapped.commentReply = trigger.commentReply;
    }
    if (trigger.nextStepId !== undefined) {
      mapped.nextStepId = trigger.nextStepId;
    }
    return mapped;
  });

export interface AutomationInput {
  readonly automations: readonly LegacyAutomation[];
  readonly automationLogs: readonly LegacyAutomationLog[];
  readonly automationContacts: readonly LegacyAutomationContact[];
}

/**
 * automations → workspace-scoped IG DM automations (platform=instagram,
 * category=dm); logs → automation_runs; contacts attach to the oldest
 * automation on the same connection, else a synthesized disabled placeholder.
 */
export const transformAutomations = (
  ctx: TransformContext,
  input: AutomationInput
): void => {
  /** legacy automation `_id` → new workspace id. */
  const automationWorkspace = new Map<string, string>();
  /** provider legacy id → [{ automationId, createdAt }] oldest-first. */
  const automationsByProvider = new Map<
    string,
    { id: string; createdAt: number }[]
  >();

  for (const auto of input.automations) {
    const connectionId = ctx.ids.connections.get(auto.socialProviderId);
    const workspaceId = ctx.connectionWorkspace.get(auto.socialProviderId);
    if (connectionId === undefined || workspaceId === undefined) {
      ctx.warnings.push(
        `automations/${auto._id}: connection ${auto.socialProviderId} not migrated — automation dropped`
      );
      continue;
    }
    // Assert dual-ownership agrees with the connection's workspace.
    if (auto.organizationId !== undefined || auto.userId !== undefined) {
      const expected = computeWorkspace(ctx, {
        organizationId: auto.organizationId,
        userId: auto.userId,
        entity: "automations",
        legacyId: auto._id,
      }).workspaceId;
      if (expected !== workspaceId) {
        ctx.warnings.push(
          `automations/${auto._id}: dual-ownership workspace ${expected} disagrees with connection workspace ${workspaceId} (using connection)`
        );
      }
    }
    recordOwnership(ctx, {
      entity: "automations",
      legacyId: auto._id,
      kind: auto.organizationId === undefined ? "user" : "org",
      workspaceId,
      resolvedVia: `connection=${auto.socialProviderId}`,
    });

    const automationId = ctx.ids.automations.getOrCreate(auto._id);
    automationWorkspace.set(auto._id, workspaceId);
    const list = automationsByProvider.get(auto.socialProviderId) ?? [];
    list.push({
      id: automationId,
      createdAt: auto.createdAt ?? auto._creationTime,
    });
    automationsByProvider.set(auto.socialProviderId, list);

    ctx.load.automations.push({
      id: automationId,
      legacyConvexId: auto._id,
      workspaceId,
      connectionId,
      platform: "instagram",
      category: "dm",
      triggerConfig: JSON.stringify(auto),
      enabled: auto.isActive,
      name: auto.name,
      description: auto.description ?? null,
      triggers: JSON.stringify(mapTriggers(ctx, auto.triggers)),
      steps: JSON.stringify(auto.steps),
      notes: JSON.stringify(auto.notes ?? []),
      nodePositions: JSON.stringify(auto.nodePositions ?? {}),
      totalTriggered: auto.totalTriggered,
      totalDmsSent: auto.totalDMsSent,
      totalFailed: auto.totalFailed,
      createdAt: epochToDateOr(
        auto.createdAt ?? auto._creationTime,
        auto._creationTime
      ),
      updatedAt: epochToDateOr(auto.updatedAt, auto._creationTime),
    });
  }

  // automationLogs → automation_runs.
  for (const log of input.automationLogs) {
    const automationId = ctx.ids.automations.get(log.automationId);
    const workspaceId = automationWorkspace.get(log.automationId);
    if (automationId === undefined || workspaceId === undefined) {
      ctx.warnings.push(
        `automationLogs/${log._id}: automation ${log.automationId} not migrated — run dropped`
      );
      continue;
    }
    const at = epochToDateOr(
      log.createdAt ?? log._creationTime,
      log._creationTime
    );
    ctx.load.automationRuns.push({
      id: makeId(AutomationRunId),
      legacyConvexId: log._id,
      workspaceId,
      automationId,
      status: "completed",
      input: JSON.stringify({
        instagramCommentId: log.instagramCommentId,
        instagramUsername: log.instagramUsername ?? null,
      }),
      output: JSON.stringify({}),
      error: null,
      startedAt: at,
      completedAt: at,
      createdAt: at,
      updatedAt: at,
    });
  }

  transformContacts(ctx, input.automationContacts, automationsByProvider);
};

const transformContacts = (
  ctx: TransformContext,
  contacts: readonly LegacyAutomationContact[],
  automationsByProvider: ReadonlyMap<
    string,
    { id: string; createdAt: number }[]
  >
): void => {
  const byProvider = new Map<string, LegacyAutomationContact[]>();
  for (const contact of contacts) {
    const list = byProvider.get(contact.socialProviderId) ?? [];
    list.push(contact);
    byProvider.set(contact.socialProviderId, list);
  }

  for (const [providerLegacyId, providerContacts] of byProvider) {
    const connectionId = ctx.ids.connections.get(providerLegacyId);
    const workspaceId = ctx.connectionWorkspace.get(providerLegacyId);
    if (connectionId === undefined || workspaceId === undefined) {
      ctx.warnings.push(
        `automationContacts: provider ${providerLegacyId} not migrated — ${providerContacts.length} contact(s) dropped`
      );
      continue;
    }

    const autos = [...(automationsByProvider.get(providerLegacyId) ?? [])].sort(
      (a, b) => a.createdAt - b.createdAt
    );
    let attachId = autos[0]?.id;
    const usingPlaceholder = attachId === undefined;
    if (usingPlaceholder) {
      attachId = makeId(AutomationId);
      ctx.counters.bump(COUNTER.automationsPlaceholderCreated);
      ctx.load.automations.push({
        id: attachId,
        legacyConvexId: null,
        workspaceId,
        connectionId,
        platform: "instagram",
        category: "dm",
        triggerConfig: JSON.stringify({ synthesized: "importedContacts" }),
        enabled: false,
        name: "Imported contacts",
        description:
          "Placeholder holding contacts collected before the migration.",
        triggers: JSON.stringify([]),
        steps: JSON.stringify([]),
        notes: JSON.stringify([]),
        nodePositions: JSON.stringify({}),
        totalTriggered: 0,
        totalDmsSent: 0,
        totalFailed: 0,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      });
    }

    // Dedupe on (automation, platform_user_id), keeping the latest.
    const latest = new Map<string, AutomationContactRow>();
    const sorted = [...providerContacts].sort(
      (a, b) =>
        (a.updatedAt ?? a._creationTime) - (b.updatedAt ?? b._creationTime)
    );
    for (const contact of sorted) {
      const key = `${attachId}::${contact.instagramUserId}`;
      if (latest.has(key)) {
        ctx.counters.bump(COUNTER.contactsDuplicateDropped);
      }
      const metadata: Record<string, unknown> = {};
      if (contact.instagramUsername !== undefined) {
        metadata.instagramUsername = contact.instagramUsername;
      }
      if (contact.collectedData !== undefined) {
        metadata.collectedData = contact.collectedData;
      }
      latest.set(key, {
        id: makeId(AutomationContactId),
        legacyConvexId: contact._id,
        workspaceId,
        automationId: attachId as string,
        platformUserId: contact.instagramUserId,
        email: contact.email ?? null,
        metadata: JSON.stringify(metadata),
        createdAt: epochToDateOr(
          contact.createdAt ?? contact._creationTime,
          contact._creationTime
        ),
        updatedAt: epochToDateOr(contact.updatedAt, contact._creationTime),
      });
      ctx.counters.bump(
        usingPlaceholder
          ? COUNTER.contactsAttachedToPlaceholder
          : COUNTER.contactsAttachedToOldest
      );
    }
    ctx.load.automationContacts.push(...latest.values());
  }
};
