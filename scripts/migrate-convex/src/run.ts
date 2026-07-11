import { Data, Effect, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import {
  DatabaseUrl,
  hostOfDatabaseUrl,
  LOCAL_HOSTS,
  OUTPUT_DIR,
} from "./config";
import { runLoad, TRUNCATE_TABLES } from "./load/loader";
import { buildManifest, type Manifest, writeManifest } from "./manifest";
import { rebuildTriggerIndex } from "./rebuild-index";
import { reconcile } from "./reconcile";
import { readSnapshot } from "./snapshot/reader";
import { runTransform } from "./transform/pipeline";

export class MigrationRunError extends Data.TaggedError("MigrationRunError")<{
  readonly message: string;
}> {}

export interface RunOptions {
  readonly snapshotPath: string;
  readonly confirmDatabase?: string;
  readonly outputDir?: string;
}

/**
 * Full `run`: transform → safety-gate → truncate-load → reconcile →
 * rebuild-index → manifest. Requires a localhost DB or a `--confirm-database`
 * matching the URL host. Idempotent by reload (spec §4.6).
 */
export const runMigration = (
  options: RunOptions
): Effect.Effect<Manifest, MigrationRunError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const url = Redacted.value(yield* DatabaseUrl.pipe(Effect.orDie));
    const host = hostOfDatabaseUrl(url);
    if (!LOCAL_HOSTS.has(host) && options.confirmDatabase !== host) {
      return yield* new MigrationRunError({
        message: `Refusing to run against non-local database host "${host}". Re-run with --confirm-database ${host} to proceed.`,
      });
    }

    const snapshot = yield* readSnapshot(options.snapshotPath).pipe(
      Effect.mapError(
        (error) => new MigrationRunError({ message: error.message })
      )
    );
    const result = yield* Effect.promise(() => runTransform(snapshot));
    if (result.data.decodeErrors.length > 0) {
      const [first] = result.data.decodeErrors;
      return yield* new MigrationRunError({
        message: `Refusing to load: ${result.data.decodeErrors.length} decode error(s). First: ${first.table}/${first.id}: ${first.message}. Run \`inspect\` to see them all.`,
      });
    }

    const sql = yield* SqlClient.SqlClient;
    yield* Effect.log(
      `Truncating (RESTART IDENTITY CASCADE): ${TRUNCATE_TABLES.join(", ")}`
    );
    yield* runLoad(sql, result.ctx.load).pipe(
      Effect.mapError(
        (error) =>
          new MigrationRunError({
            message: "message" in error ? error.message : String(error),
          })
      )
    );

    const recon = yield* reconcile(sql).pipe(
      Effect.mapError(
        (error) => new MigrationRunError({ message: String(error) })
      )
    );
    const triggerIndexRows = yield* rebuildTriggerIndex(sql).pipe(
      Effect.mapError(
        (error) => new MigrationRunError({ message: String(error) })
      )
    );

    const manifest = buildManifest(result, recon, triggerIndexRows);
    const path = yield* writeManifest(
      manifest,
      options.outputDir ?? OUTPUT_DIR
    ).pipe(
      Effect.mapError(
        (error) => new MigrationRunError({ message: error.message })
      )
    );

    yield* Effect.log(
      `Migration complete: ${Object.values(manifest.tables).reduce((a, b) => a + b, 0)} rows across ${
        Object.keys(manifest.tables).length
      } tables; reconciliation updated ${recon.subscriptionsUpdated} subscription(s); ${triggerIndexRows} trigger-index row(s). Manifest: ${path}`
    );
    if (result.ctx.warnings.length > 0) {
      yield* Effect.log(
        `${result.ctx.warnings.length} warning(s) recorded in the manifest.`
      );
    }
    return manifest;
  });
