import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { PgClient, PgMigrator } from "@effect/sql-pg";
import {
  Config,
  Effect,
  String as EffectString,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { sqlMigrationLoader } from "./migrations";

const DatabaseUrl = Config.redacted("DATABASE_URL").pipe(
  Config.withDefault(
    Redacted.make("postgres://delulu:delulu@localhost:5432/delulu")
  )
);

const PgLive = Layer.unwrap(
  Effect.map(DatabaseUrl, (url) =>
    PgClient.layer({
      url,
      transformQueryNames: EffectString.camelToSnake,
      transformResultNames: EffectString.snakeToCamel,
      transformJson: true,
    })
  )
);

const migrations = PgMigrator.run({
  loader: sqlMigrationLoader,
  table: "effect_sql_migrations",
});
const MigrationRow = Schema.Struct({
  migrationId: Schema.Number,
  name: Schema.String,
  createdAt: Schema.Date,
});
const MigrationTable = Schema.Struct({
  tableName: Schema.NullOr(Schema.String),
});

const status = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const findTable = SqlSchema.findOne({
    Request: Schema.Void,
    Result: MigrationTable,
    execute: () =>
      sql`SELECT to_regclass('effect_sql_migrations')::text AS table_name`,
  });
  const table = yield* findTable(undefined);
  if (table.tableName === null) {
    yield* Effect.log("No migrations have been applied");
    return;
  }
  const query = SqlSchema.findAll({
    Request: Schema.Void,
    Result: MigrationRow,
    execute: () =>
      sql`SELECT migration_id, name, created_at FROM effect_sql_migrations ORDER BY migration_id`,
  });
  const rows = yield* query(undefined);
  for (const row of rows) {
    yield* Effect.log(
      `${String(row.migrationId).padStart(4, "0")} ${row.name}`
    );
  }
});

const command = process.argv[2] ?? "up";
if (command === "status") {
  NodeRuntime.runMain(
    status.pipe(Effect.provide(PgLive), Effect.provide(NodeServices.layer))
  );
} else if (command === "up") {
  NodeRuntime.runMain(
    migrations.pipe(Effect.provide(PgLive), Effect.provide(NodeServices.layer))
  );
} else {
  console.error(`Unknown migration command: ${command}`);
  process.exitCode = 1;
}
