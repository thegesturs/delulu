import { Effect } from "effect";
import type { SqlClient, SqlError } from "effect/unstable/sql";

interface AutomationIndexRow {
  readonly id: string;
  readonly connectionId: string;
  readonly enabled: boolean;
  readonly triggers: ReadonlyArray<{
    readonly targetPostIds?: readonly string[];
  }>;
  readonly profileId: string;
}

/**
 * Rebuild `automation_trigger_index` from the loaded automations, mirroring
 * `AutomationService.indexAutomation` (packages/services/src/automations.ts):
 * one row per (automation, IG media id). KV write-through is out of M5 scope
 * (runbook §4.7 step 4 uses the M3 services). Returns the row count written.
 */
export const rebuildTriggerIndex = (
  sql: SqlClient.SqlClient
): Effect.Effect<number, SqlError.SqlError> =>
  sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`DELETE FROM automation_trigger_index`;
      const automations = yield* sql<AutomationIndexRow>`
        SELECT a.id, a.connection_id, a.enabled, a.triggers, c.profile_id
        FROM automations a
        JOIN connections c ON c.id = a.connection_id`;
      let written = 0;
      for (const automation of automations) {
        const mediaIds = [
          ...new Set(
            (automation.triggers ?? []).flatMap(
              (trigger) => trigger.targetPostIds ?? []
            )
          ),
        ];
        for (const mediaId of mediaIds) {
          yield* sql`INSERT INTO automation_trigger_index
            (automation_id, connection_id, profile_id, media_id, enabled)
            VALUES (${automation.id}, ${automation.connectionId}, ${automation.profileId}, ${mediaId}, ${automation.enabled})
            ON CONFLICT (automation_id, media_id)
            DO UPDATE SET connection_id = EXCLUDED.connection_id, profile_id = EXCLUDED.profile_id, enabled = EXCLUDED.enabled`;
          written += 1;
        }
      }
      return written;
    })
  );
