import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type AutomationDoc = Doc<"automations">;

// Extract the set of Instagram mediaIds an automation fires on. Dedup across
// triggers because a single automation can list the same mediaId multiple times.
function mediaIdsFromAutomation(automation: AutomationDoc): Set<string> {
  const ids = new Set<string>();
  for (const trigger of automation.triggers) {
    for (const mediaId of trigger.targetPostIds ?? []) {
      ids.add(mediaId);
    }
  }
  return ids;
}

/**
 * Diff the current automationMediaTriggers rows against what this automation
 * should have, and apply the minimum number of writes. Safe to call with
 * `oldAutomation: null` for creates and with a null/deleted doc for deletes.
 *
 * Owner of the row is (automationId, mediaId). `profileId` and
 * `socialProviderId` come from the current automation's provider so the row
 * stays denormalized.
 */
export async function syncAutomationMediaTriggers(
  ctx: MutationCtx,
  automation: AutomationDoc | null,
  // Pre-resolved to let the caller avoid an extra ctx.db.get during delete.
  providerProfileId: string | null
) {
  const automationId = automation?._id;
  if (!automationId) {
    return;
  }

  const existingRows = await ctx.db
    .query("automationMediaTriggers")
    .withIndex("by_automation", (q) => q.eq("automationId", automationId))
    .collect();

  const desiredMediaIds = automation
    ? mediaIdsFromAutomation(automation)
    : new Set<string>();
  const existingByMediaId = new Map<string, Doc<"automationMediaTriggers">>();
  for (const row of existingRows) {
    existingByMediaId.set(row.mediaId, row);
  }

  // Delete rows for mediaIds that are no longer targeted.
  for (const [mediaId, row] of existingByMediaId) {
    if (!desiredMediaIds.has(mediaId)) {
      await ctx.db.delete(row._id);
    }
  }

  if (!(automation && providerProfileId)) {
    return;
  }

  const isActive = automation.isActive;
  // Insert new rows and update isActive/profileId on existing ones.
  for (const mediaId of desiredMediaIds) {
    const row = existingByMediaId.get(mediaId);
    if (row) {
      if (
        row.isActive !== isActive ||
        row.profileId !== providerProfileId ||
        row.socialProviderId !== automation.socialProviderId
      ) {
        await ctx.db.patch(row._id, {
          isActive,
          profileId: providerProfileId,
          socialProviderId: automation.socialProviderId,
        });
      }
    } else {
      await ctx.db.insert("automationMediaTriggers", {
        automationId,
        socialProviderId: automation.socialProviderId,
        profileId: providerProfileId,
        mediaId,
        isActive,
      });
    }
  }
}

/**
 * Delete every trigger-index row for an automation. Used right before deleting
 * the automation itself.
 */
export async function deleteAutomationMediaTriggers(
  ctx: MutationCtx,
  automationId: Id<"automations">
) {
  const rows = await ctx.db
    .query("automationMediaTriggers")
    .withIndex("by_automation", (q) => q.eq("automationId", automationId))
    .collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
}
