import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeTokenCipher, TokenCipher } from "@delulu/core";
import { NodeServices } from "@effect/platform-node";
import { PgClient, PgMigrator } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sqlMigrationLoader } from "../../../../packages/db/src/migrations";
import { EXPECTED_MIGRATION_HEAD } from "../../src/config";
import { runMigration } from "../../src/run";
import { runVerify } from "../../src/verify/run";
import { checkInvariants } from "../../src/verify/structural";
import { buildSnapshotZip } from "../fixtures/builder";
import { withEncryptedTokens } from "../fixtures/encrypt";
import { legacyTables } from "../fixtures/legacy-data";

const SECRET = "integration-secret";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu";
const schema = `import_test_${randomUUID().replaceAll("-", "")}`;
const isolatedUrl = new URL(databaseUrl);
isolatedUrl.searchParams.set("options", `-csearch_path=${schema}`);
const databaseLayer = (url: string) =>
  PgClient.layer({
    url: Redacted.make(url),
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: true,
  });
const AdminLive = databaseLayer(databaseUrl);
const DatabaseLive = databaseLayer(isolatedUrl.toString());
const administer = (drop: boolean) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      if (drop) {
        yield* sql`DROP SCHEMA IF EXISTS ${sql(schema)} CASCADE`;
      } else {
        yield* sql`CREATE SCHEMA ${sql(schema)}`;
      }
    }).pipe(Effect.provide(AdminLive))
  );
const TokenLive = Layer.succeed(
  TokenCipher,
  TokenCipher.of(makeTokenCipher(SECRET))
);

const outDir = mkdtempSync(join(tmpdir(), "migrate-convex-"));
let snapshotPath: string;

const run = <A, E>(effect: Effect.Effect<A, E, SqlClient.SqlClient>) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(DatabaseLive)) as Effect.Effect<A, E>
  );

const runWithToken = <A, E>(
  effect: Effect.Effect<A, E, SqlClient.SqlClient | TokenCipher>
) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(TokenLive),
      Effect.provide(DatabaseLive)
    ) as Effect.Effect<A, E>
  );

const counts = () =>
  run(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const rows = yield* sql<{ table: string; n: number }>`
        SELECT 'posts' AS table, count(*)::int AS n FROM posts
        UNION ALL SELECT 'targets', count(*)::int FROM post_targets
        UNION ALL SELECT 'workspaces', count(*)::int FROM workspaces
        UNION ALL SELECT 'automations', count(*)::int FROM automations
        UNION ALL SELECT 'oauth_clients', count(*)::int FROM oauth_clients`;
      return Object.fromEntries(rows.map((r) => [r.table, r.n]));
    })
  );

describe("migrate-convex integration", () => {
  beforeAll(async () => {
    await administer(false);
    await Effect.runPromise(
      PgMigrator.run({
        loader: sqlMigrationLoader.pipe(
          Effect.map((migrations) =>
            migrations.filter(([id]) => id <= EXPECTED_MIGRATION_HEAD)
          )
        ),
        table: "effect_sql_migrations",
      }).pipe(Effect.provide(DatabaseLive), Effect.provide(NodeServices.layer))
    );
    const encrypted = await withEncryptedTokens(legacyTables, SECRET);
    snapshotPath = join(outDir, "golden.zip");
    writeFileSync(snapshotPath, buildSnapshotZip(encrypted));
    await run(runMigration({ snapshotPath, outputDir: outDir }));
  });

  afterAll(async () => {
    await administer(true);
    rmSync(outDir, { recursive: true, force: true });
  });

  it("rejects a newer schema before truncating any imported data", async () => {
    const before = await counts();
    await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`INSERT INTO effect_sql_migrations (migration_id, name) VALUES (15, 'retired_queue')`;
      })
    );
    try {
      await expect(
        run(runMigration({ snapshotPath, outputDir: outDir }))
      ).rejects.toThrow("Migration head is 15, expected 13");
      expect(await counts()).toEqual(before);
    } finally {
      await run(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`DELETE FROM effect_sql_migrations WHERE migration_id = 15`;
        })
      );
    }
  });

  it("passes all 8 verification checks", async () => {
    const results = await runWithToken(
      runVerify({ snapshotPath, sampleSize: 50, allow: {}, outputDir: outDir })
    );
    expect(results.every((r) => r.pass)).toBe(true);
    expect(results).toHaveLength(8);
  });

  it("is idempotent: a second run yields identical counts and stays green", async () => {
    const before = await counts();
    await run(runMigration({ snapshotPath, outputDir: outDir }));
    const after = await counts();
    expect(after).toEqual(before);
    const results = await runWithToken(
      runVerify({ snapshotPath, sampleSize: 50, allow: {}, outputDir: outDir })
    );
    expect(results.every((r) => r.pass)).toBe(true);
  });

  it("preserves seeded oauth_clients across truncation", async () => {
    const c = await counts();
    expect(c.oauth_clients).toBeGreaterThan(0);
  });

  it("detects a mutated row (invariant check fails)", async () => {
    // Corrupt a post's stored status, then confirm the invariant check catches it.
    await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`UPDATE posts SET status = 'published'
          WHERE id = (SELECT id FROM posts WHERE status = 'draft' LIMIT 1)`;
      })
    );
    const check = await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        return yield* checkInvariants(sql);
      })
    );
    expect(check.pass).toBe(false);
    expect(check.details.some((d) => d.includes("≠ computed"))).toBe(true);
    // Restore a clean state for any following runs.
    await run(runMigration({ snapshotPath, outputDir: outDir }));
  });
});
