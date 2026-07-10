import { readdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/unstable/sql";

export const migrationsDirectory = resolve(
  import.meta.dirname,
  "../migrations"
);
const migrationNamePattern = /^(\d{4})_([a-z0-9_]+)\.sql$/;

export const sqlMigrationLoader: Migrator.Loader = Effect.try({
  try: () =>
    readdirSync(migrationsDirectory)
      .filter((file) => migrationNamePattern.test(file))
      .sort()
      .map((file) => {
        const match = migrationNamePattern.exec(basename(file));
        if (!match) {
          throw new Error(`Invalid migration filename: ${file}`);
        }
        const sqlText = readFileSync(
          resolve(migrationsDirectory, file),
          "utf8"
        );
        return [
          Number(match[1]),
          match[2],
          Effect.succeed(
            Effect.gen(function* () {
              const sql = yield* SqlClient.SqlClient;
              yield* sql.unsafe(sqlText);
            })
          ),
        ] as const;
      }),
  catch: (cause) =>
    new Migrator.MigrationError({
      kind: "Failed",
      cause,
      message: "Unable to load SQL migrations",
    }),
});
