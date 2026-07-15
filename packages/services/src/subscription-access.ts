import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";

/** Stops queued and active product work for every workspace funded by a payer. */
export const stopBilledWorkspaceWork = Effect.fn("stopBilledWorkspaceWork")(
  function* (billingOwnerUserId: string) {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`UPDATE automations SET enabled = false WHERE workspace_id IN (
    SELECT id FROM workspaces WHERE billing_owner_user_id = ${billingOwnerUserId})`;
    yield* sql`UPDATE jobs SET status = 'failed', locked_until = NULL,
    last_error = 'Subscription ended' WHERE status IN ('pending','leased')
    AND workspace_id IN (SELECT id FROM workspaces
      WHERE billing_owner_user_id = ${billingOwnerUserId})`;
    yield* sql`UPDATE posts SET status = 'failed' WHERE status IN ('scheduled','publishing')
    AND workspace_id IN (SELECT id FROM workspaces
      WHERE billing_owner_user_id = ${billingOwnerUserId})`;
    yield* sql`UPDATE post_targets SET status = 'failed', error = 'Subscription ended'
    WHERE status IN ('pending','publishing') AND post_id IN (
      SELECT p.id FROM posts p JOIN workspaces w ON w.id = p.workspace_id
      WHERE w.billing_owner_user_id = ${billingOwnerUserId})`;
  }
);
