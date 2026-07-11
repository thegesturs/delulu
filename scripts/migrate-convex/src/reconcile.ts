import { Effect } from "effect";
import type { SqlClient, SqlError } from "effect/unstable/sql";

export interface ReconciliationResult {
  readonly subscriptionsUpdated: number;
  readonly reservationsExpired: number;
}

/**
 * Post-load quota reconciliation. Reproduces `BillingReconciliation.run`
 * (packages/services/src/billing-reconciliation.ts) verbatim so the migrator
 * stays self-contained (no dependency on the app service graph) while matching
 * exactly what the running system computes — verify check 6 re-runs it and
 * asserts a no-op. Keep in sync with the service if its query changes.
 */
export const reconcile = (
  sql: SqlClient.SqlClient
): Effect.Effect<ReconciliationResult, SqlError.SqlError> =>
  sql.withTransaction(
    Effect.gen(function* () {
      const expired = yield* sql<{ count: string }>`WITH changed AS (
        UPDATE quota_reservations SET status = 'expired'
        WHERE status = 'pending' AND expires_at <= now() RETURNING 1
      ) SELECT count(*)::text AS count FROM changed`;
      const updated = yield* sql<{ billingOwnerUserId: string }>`
        WITH selected AS (
          SELECT billing_owner_user_id, current_period_start FROM subscriptions
        ), actual AS (
          SELECT selected.billing_owner_user_id,
            (SELECT count(*) FROM connections c JOIN workspaces w ON w.id = c.workspace_id
              WHERE w.billing_owner_user_id = selected.billing_owner_user_id AND w.deleted_at IS NULL)::bigint AS social_accounts,
            (SELECT count(*) FROM posts p JOIN workspaces w ON w.id = p.workspace_id
              WHERE w.billing_owner_user_id = selected.billing_owner_user_id AND w.deleted_at IS NULL
                AND p.deleted_at IS NULL
                AND p.created_at >= COALESCE(selected.current_period_start, date_trunc('month', now())))::bigint AS monthly_posts,
            (SELECT COALESCE(sum(m.size_bytes), 0) FROM media m JOIN workspaces w ON w.id = m.workspace_id
              WHERE w.billing_owner_user_id = selected.billing_owner_user_id AND w.deleted_at IS NULL
                AND m.deleted_at IS NULL)::bigint AS media_storage_bytes,
            (SELECT count(*) FROM transcriptions t JOIN workspaces w ON w.id = t.workspace_id
              WHERE w.billing_owner_user_id = selected.billing_owner_user_id AND w.deleted_at IS NULL)::bigint AS transcriptions_used
          FROM selected
        )
        UPDATE subscriptions s SET
          social_accounts = actual.social_accounts,
          monthly_posts = actual.monthly_posts,
          media_storage_bytes = actual.media_storage_bytes,
          transcriptions_used = actual.transcriptions_used
        FROM actual WHERE s.billing_owner_user_id = actual.billing_owner_user_id
        RETURNING s.billing_owner_user_id`;
      return {
        subscriptionsUpdated: updated.length,
        reservationsExpired: Number(expired[0]?.count ?? 0),
      };
    })
  );
