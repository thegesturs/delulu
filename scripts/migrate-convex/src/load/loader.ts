import { Data, Effect } from "effect";
import type { SqlClient, SqlError } from "effect/unstable/sql";
import { EXPECTED_MIGRATION_HEAD, INSERT_CHUNK_SIZE } from "../config";
import type { LoadSet } from "../transform/types";

export class LoaderError extends Data.TaggedError("LoaderError")<{
  readonly message: string;
}> {}

/**
 * Tables the loader owns: every migrated table + jobs + the automation trigger
 * index/repairs. TRUNCATE … CASCADE also clears empty runtime ledgers
 * (quota_reservations, billing_owner_transfers, oauth grant/code/refresh,
 * automation_sessions/dm_dispatches) that FK these — all empty at cutover. The
 * seeded `oauth_clients`, `webhook_deliveries`, and `billing_webhook_events`
 * have no FK into this set and survive.
 */
const TRUNCATE_TABLES = [
  "users",
  "workspaces",
  "workspace_members",
  "connections",
  "media",
  "posts",
  "post_targets",
  "jobs",
  "subscriptions",
  "subscription_addons",
  "transactions",
  "post_reviews",
  "review_activity",
  "automations",
  "automation_runs",
  "automation_contacts",
  "transcriptions",
  "automation_trigger_index",
  "automation_trigger_repairs",
] as const;

/** Insert order honouring foreign-key dependencies. */
const INSERT_ORDER: readonly (keyof LoadSet)[] = [
  "users",
  "workspaces",
  "workspaceMembers",
  "connections",
  "media",
  "posts",
  "postTargets",
  "jobs",
  "subscriptions",
  "subscriptionAddons",
  "transactions",
  "postReviews",
  "reviewActivity",
  "automations",
  "automationRuns",
  "automationContacts",
  "transcriptions",
] as const;

const TABLE_SQL_NAME: Record<keyof LoadSet, string> = {
  users: "users",
  workspaces: "workspaces",
  workspaceMembers: "workspace_members",
  connections: "connections",
  media: "media",
  posts: "posts",
  postTargets: "post_targets",
  jobs: "jobs",
  subscriptions: "subscriptions",
  subscriptionAddons: "subscription_addons",
  transactions: "transactions",
  postReviews: "post_reviews",
  reviewActivity: "review_activity",
  automations: "automations",
  automationRuns: "automation_runs",
  automationContacts: "automation_contacts",
  transcriptions: "transcriptions",
};

const chunk = <A>(rows: readonly A[], size: number): A[][] => {
  const out: A[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    out.push(rows.slice(i, i + size));
  }
  return out;
};

export const assertMigrationHead = (
  sql: SqlClient.SqlClient
): Effect.Effect<number, SqlError.SqlError | LoaderError> =>
  Effect.gen(function* () {
    const exists = yield* sql<{ regclass: string | null }>`
      SELECT to_regclass('effect_sql_migrations')::text AS regclass`;
    if (!exists[0] || exists[0].regclass === null) {
      return yield* new LoaderError({
        message:
          "effect_sql_migrations table not found — run `pnpm pg:migrate` first",
      });
    }
    const rows = yield* sql<{ head: number }>`
      SELECT COALESCE(max(migration_id), 0)::int AS head FROM effect_sql_migrations`;
    const head = rows[0]?.head ?? 0;
    if (head !== EXPECTED_MIGRATION_HEAD) {
      return yield* new LoaderError({
        message: `Migration head is ${head}, expected ${EXPECTED_MIGRATION_HEAD}. Apply pending migrations before loading.`,
      });
    }
    return head;
  });

export const truncateStatementText = (): string =>
  `TRUNCATE ${TRUNCATE_TABLES.join(", ")} RESTART IDENTITY CASCADE`;

/**
 * Truncate the migrated tables and reload the whole `LoadSet` inside one
 * transaction (idempotent by reload, spec §4.6). Asserts the schema head first.
 */
export const runLoad = (
  sql: SqlClient.SqlClient,
  loadSet: LoadSet
): Effect.Effect<void, SqlError.SqlError | LoaderError> =>
  sql.withTransaction(
    Effect.gen(function* () {
      yield* assertMigrationHead(sql);
      yield* sql.unsafe(truncateStatementText());
      for (const key of INSERT_ORDER) {
        const rows = loadSet[key] as unknown as readonly Record<
          string,
          unknown
        >[];
        if (rows.length === 0) {
          continue;
        }
        const table = TABLE_SQL_NAME[key];
        for (const batch of chunk(rows, INSERT_CHUNK_SIZE)) {
          yield* sql`INSERT INTO ${sql(table)} ${sql.insert(batch)}`;
        }
      }
    })
  );

export { INSERT_ORDER, TRUNCATE_TABLES };
