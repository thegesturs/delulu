import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { describe, expect, it } from "vitest";

const DatabaseLive = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const migrationSql = (number: number, name: string): string =>
  readFileSync(
    resolve(
      import.meta.dirname,
      `../../migrations/${String(number).padStart(4, "0")}_${name}.sql`
    ),
    "utf8"
  );

const historicalMigrations = [
  migrationSql(1, "initial_schema"),
  migrationSql(2, "auth"),
  migrationSql(3, "domain_services"),
  migrationSql(4, "automations_webhooks"),
  migrationSql(5, "analytics_billing"),
  migrationSql(6, "transcription_cutover"),
  migrationSql(7, "oauth_workspace_binding"),
  migrationSql(8, "messaging_retention"),
  migrationSql(9, "agent_device_auth"),
];
const entitlementMigration = migrationSql(10, "preserve_billing_entitlements");

describe("billing entitlement migration", () => {
  it("normalizes one base subscription and multiple add-ons without guessing", async () => {
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const schema = `billing_migration_${suffix}`;
    const recoveredUser = `user_recovered_${suffix}`;
    const unknownUser = `user_unknown_${suffix}`;
    const customerId = `customer_${suffix}`;
    const recoveredAddonId = `addon_recovered_${suffix}`;
    const recoveredBaseId = `base_recovered_${suffix}`;

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql.unsafe(`CREATE SCHEMA ${schema}`);
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql.unsafe(`SET LOCAL search_path TO ${schema}`);
              for (const migration of historicalMigrations) {
                yield* sql.unsafe(migration);
              }
              yield* sql`INSERT INTO users (id, external_id) VALUES
                (${recoveredUser}, ${`external_recovered_${suffix}`}),
                (${unknownUser}, ${`external_unknown_${suffix}`})`;
              yield* sql`INSERT INTO subscriptions
                (id, billing_owner_user_id, provider_customer_id,
                  provider_subscription_id, plan, status, media_storage_bytes,
                  current_period_start, current_period_end)
                VALUES
                (${`subscription_recovered_${suffix}`}, ${recoveredUser},
                  ${customerId}, ${recoveredAddonId},
                  'pdt_0NYbkcEzkjqKXheG8mvVT', 'active', 4444137653,
                  '2026-07-01T00:00:00Z', '2026-08-01T00:00:00Z'),
                (${`subscription_unknown_${suffix}`}, ${unknownUser},
                  ${`customer_unknown_${suffix}`}, ${`addon_unknown_${suffix}`},
                  'pdt_0NYbkcEzkjqKXheG8mvVT', 'active', 42,
                  '2026-07-01T00:00:00Z', '2026-08-01T00:00:00Z')`;
              yield* sql`INSERT INTO billing_webhook_events
                (provider_event_id, event_type, payload)
                VALUES (${`event_${suffix}`}, 'SubscriptionChanged',
                  ${JSON.stringify({
                    _tag: "SubscriptionChanged",
                    billingOwnerUserId: recoveredUser,
                    providerCustomerId: customerId,
                    providerSubscriptionId: recoveredBaseId,
                    plan: "VIBE",
                    status: "active",
                    currentPeriodStart: "2026-07-01T00:00:00Z",
                    currentPeriodEnd: "2026-08-01T00:00:00Z",
                    billingInterval: "MONTH",
                    currency: "USD",
                    recurringAmountMinor: 999,
                    cancelAtPeriodEnd: false,
                    providerOccurredAt: "2026-07-02T00:00:00Z",
                  })}::jsonb)`;

              yield* sql.unsafe(entitlementMigration);
              const rows = yield* sql<{
                billingOwnerUserId: string;
                plan: string;
                providerSubscriptionId: string | null;
                mediaStorageBytes: string;
                addonSubscriptionId: string;
              }>`SELECT s.billing_owner_user_id, s.plan,
                  s.provider_subscription_id, s.media_storage_bytes::text,
                  a.provider_subscription_id AS addon_subscription_id
                FROM subscriptions s
                JOIN subscription_addons a ON a.base_subscription_id = s.id
                ORDER BY s.billing_owner_user_id`;
              return rows;
            })
          )
          .pipe(
            Effect.ensuring(
              sql
                .unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
                .pipe(Effect.orDie)
            )
          );
      }).pipe(Effect.provide(DatabaseLive))
    );

    expect(result).toEqual([
      {
        billingOwnerUserId: recoveredUser,
        plan: "VIBE",
        providerSubscriptionId: recoveredBaseId,
        mediaStorageBytes: "4444137653",
        addonSubscriptionId: recoveredAddonId,
      },
      {
        billingOwnerUserId: unknownUser,
        plan: "FREE",
        providerSubscriptionId: null,
        mediaStorageBytes: "42",
        addonSubscriptionId: `addon_unknown_${suffix}`,
      },
    ]);
  });
});
