import type { Doc, Id } from "../_generated/dataModel";

/**
 * Pure helpers that compute KV sync ops from an automation or session doc
 * diff. Callers (mutations in automations.ts) build the op list and schedule
 * the KV action; this file has no Convex ctx access so it stays unit-testable
 * and side-effect-free.
 */

type AutomationDoc = Doc<"automations">;
type SessionDoc = Doc<"automationSessions">;

export interface TriggerKvOp {
  op: "add" | "remove";
  profileId: string;
  mediaId: string;
  automationId: Id<"automations">;
}

export interface SessionKvOp {
  op: "put" | "delete";
  instagramUserId: string;
  // Only set for "put".
  sessionId?: Id<"automationSessions">;
}

// Flatten + dedup all targetPostIds on an automation.
function mediaIdsOf(automation: AutomationDoc): Set<string> {
  const ids = new Set<string>();
  for (const trigger of automation.triggers) {
    for (const mediaId of trigger.targetPostIds ?? []) {
      ids.add(mediaId);
    }
  }
  return ids;
}

/**
 * Diff an old automation state against a new one. Returns the KV ops that
 * should be scheduled to keep `trig:{profileId}:{mediaId}` in sync.
 *
 *  - create (oldAutomation = null): every new mediaId → add
 *  - delete (newAutomation = null): every old mediaId → remove
 *  - update: symmetric diff, plus a full add/remove on isActive flip
 *
 * `profileId` is the owning social provider's profileId (Instagram account
 * id the webhook fires against). For creates + updates it's the current
 * provider; for deletes it's the provider at the time of deletion.
 */
export function triggerDiff(
  oldAutomation: AutomationDoc | null,
  newAutomation: AutomationDoc | null,
  profileId: string | null
): TriggerKvOp[] {
  if (!profileId) {
    return [];
  }
  const oldActive = oldAutomation?.isActive ?? false;
  const newActive = newAutomation?.isActive ?? false;
  const oldIds = oldAutomation ? mediaIdsOf(oldAutomation) : new Set<string>();
  const newIds = newAutomation ? mediaIdsOf(newAutomation) : new Set<string>();
  const automationId = (newAutomation ?? oldAutomation)?._id;
  if (!automationId) {
    return [];
  }

  const ops: TriggerKvOp[] = [];

  // When isActive flips, force every relevant mediaId to be re-added or
  // removed. This is cheap (small set of ids) and avoids subtle bugs around
  // "was in list but now inactive so should be removed".
  if (oldActive !== newActive) {
    // Inactive → active: add every current mediaId.
    if (newActive && newAutomation) {
      for (const mediaId of newIds) {
        ops.push({ op: "add", profileId, mediaId, automationId });
      }
    }
    // Active → inactive (or deleted): remove every old mediaId.
    if (oldActive && oldAutomation) {
      for (const mediaId of oldIds) {
        ops.push({ op: "remove", profileId, mediaId, automationId });
      }
    }
    return ops;
  }

  // Both states inactive → no KV presence either way, nothing to do.
  if (!(oldActive || newActive)) {
    return [];
  }

  // Both active (or purely a targetPostIds edit) — classic symmetric diff.
  for (const mediaId of newIds) {
    if (!oldIds.has(mediaId)) {
      ops.push({ op: "add", profileId, mediaId, automationId });
    }
  }
  for (const mediaId of oldIds) {
    if (!newIds.has(mediaId)) {
      ops.push({ op: "remove", profileId, mediaId, automationId });
    }
  }
  return ops;
}

/**
 * Decide the session KV op based on before/after session state. `put` when
 * the session is the currently-active one for a user; `delete` when it
 * transitions away from active (or is a no-op otherwise).
 */
export function sessionOp(
  oldSession: SessionDoc | null,
  newSession: SessionDoc | null
): SessionKvOp | null {
  // Create of an active session → put. (Existing active sessions for the
  // user are already expired in createSession itself, so the put safely
  // overwrites whatever was there.)
  if (!oldSession && newSession) {
    if (newSession.status === "active") {
      return {
        op: "put",
        instagramUserId: newSession.instagramUserId,
        sessionId: newSession._id,
      };
    }
    return null;
  }

  // Update: only react to status transitions involving "active".
  if (oldSession && newSession) {
    const wasActive = oldSession.status === "active";
    const nowActive = newSession.status === "active";
    if (wasActive && !nowActive) {
      return { op: "delete", instagramUserId: newSession.instagramUserId };
    }
    if (!wasActive && nowActive) {
      return {
        op: "put",
        instagramUserId: newSession.instagramUserId,
        sessionId: newSession._id,
      };
    }
    return null;
  }

  // Hard delete path (not used today but handled for completeness).
  if (oldSession && !newSession && oldSession.status === "active") {
    return { op: "delete", instagramUserId: oldSession.instagramUserId };
  }
  return null;
}
