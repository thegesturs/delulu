import { Config, Redacted } from "effect";

/**
 * Direct :5432 connection string. The migrator talks to Postgres directly, not
 * through the Workers HTTP path (spec §4.6). Defaults to the local docker
 * harness so `run`/`verify` are safe by default without a `--confirm-database`.
 */
export const DEFAULT_DATABASE_URL =
  "postgres://delulu:delulu@localhost:5432/delulu";

export const DatabaseUrl = Config.redacted("DATABASE_URL").pipe(
  Config.withDefault(Redacted.make(DEFAULT_DATABASE_URL))
);

/** Only `verify`/`report` need the secret — no plaintext token in the pipeline (§4.3). */
export const EncryptionSecret = Config.redacted("ENCRYPTION_SECRET");

/** Migration head the loader asserts before truncating (bump when a migration is added). */
export const EXPECTED_MIGRATION_HEAD = 5;

/** Output directory for the run manifest and report artifacts. */
export const OUTPUT_DIR = "migration-out";

/** Rows per INSERT chunk during load. */
export const INSERT_CHUNK_SIZE = 500;

/** Hosts treated as local (no `--confirm-database` required). */
export const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", ""]);

export const hostOfDatabaseUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};
