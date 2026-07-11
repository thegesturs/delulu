#!/usr/bin/env -S npx tsx
import { readFileSync } from "node:fs";
import { TokenCipher } from "@delulu/core";
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";
import { SqlClient } from "effect/unstable/sql";
import { OUTPUT_DIR } from "./config";
import { runInspect } from "./inspect";
import { PgLive } from "./pg";
import { rebuildTriggerIndex } from "./rebuild-index";
import { generateReports } from "./report";
import { runMigration } from "./run";
import { runVerify } from "./verify/run";
import type { AllowList } from "./verify/types";

const loadAllow = (path: string | undefined): AllowList => {
  if (path === undefined) {
    return {};
  }
  return JSON.parse(readFileSync(path, "utf8")) as AllowList;
};

const snapshotFlag = Flag.string("snapshot").pipe(
  Flag.withAlias("s"),
  Flag.withDescription("Path to the `npx convex export` ZIP snapshot")
);
const confirmDatabaseFlag = Flag.string("confirm-database").pipe(
  Flag.optional,
  Flag.withDescription(
    "Confirm a non-local DB host (must equal the DATABASE_URL host)"
  )
);

const inspect = Command.make(
  "inspect",
  { snapshot: snapshotFlag },
  ({ snapshot }) => runInspect(snapshot).pipe(Effect.asVoid)
).pipe(
  Command.withDescription(
    "Read a snapshot and print per-table counts, unknown tables, and decode errors (no DB)."
  )
);

const run = Command.make(
  "run",
  { snapshot: snapshotFlag, confirmDatabase: confirmDatabaseFlag },
  ({ snapshot, confirmDatabase }) =>
    runMigration({
      snapshotPath: snapshot,
      confirmDatabase: Option.getOrUndefined(confirmDatabase),
    }).pipe(Effect.provide(PgLive), Effect.asVoid)
).pipe(
  Command.withDescription(
    "Transform → truncate-load → reconcile → rebuild-index; writes migration-out/migration_run.json."
  )
);

const sampleSizeFlag = Flag.integer("sample-size").pipe(
  Flag.withDefault(50),
  Flag.withDescription("Rows per table for sampled deep-equality (check 4)")
);
const allowFlag = Flag.string("allow").pipe(
  Flag.optional,
  Flag.withDescription(
    "Path to a JSON allow-list documenting accepted quota diffs (check 6)"
  )
);

const verify = Command.make(
  "verify",
  { snapshot: snapshotFlag, sampleSize: sampleSizeFlag, allow: allowFlag },
  ({ snapshot, sampleSize, allow }) =>
    runVerify({
      snapshotPath: snapshot,
      sampleSize,
      allow: loadAllow(Option.getOrUndefined(allow)),
    }).pipe(
      Effect.provide(TokenCipher.layer),
      Effect.provide(PgLive),
      Effect.asVoid
    )
).pipe(
  Command.withDescription(
    "Run the 8-check verification suite against the loaded DB (non-zero exit on failure)."
  )
);

const report = Command.make(
  "report",
  { snapshot: snapshotFlag },
  ({ snapshot }) =>
    generateReports(snapshot, OUTPUT_DIR).pipe(
      Effect.tap((paths) =>
        Effect.log(`Wrote ${paths.length} report(s): ${paths.join(", ")}`)
      ),
      Effect.asVoid
    )
).pipe(
  Command.withDescription(
    "Write role-mapping, ownership, and edge-case markdown reports (read-only)."
  )
);

const rebuildIndex = Command.make("rebuild-index", {}, () =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* rebuildTriggerIndex(sql);
    yield* Effect.log(`Rebuilt automation_trigger_index: ${rows} row(s).`);
  }).pipe(Effect.provide(PgLive))
).pipe(
  Command.withDescription(
    "Rebuild automation_trigger_index from loaded automations (runbook §4.7 step 4)."
  )
);

const cli = Command.make("migrate-convex").pipe(
  Command.withDescription(
    "One-off Convex → Postgres migration CLI (backend revamp M5)."
  ),
  Command.withSubcommands([inspect, run, verify, report, rebuildIndex])
);

Command.run(cli, { version: "0.0.0" }).pipe(
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
);
