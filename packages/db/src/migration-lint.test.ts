import { describe, expect, it } from "vitest";
import { validateMigrations } from "./migration-lint";

describe("migration lint", () => {
  it("accepts a sequential additive migration set", () => {
    expect(
      validateMigrations({
        files: [{ name: "0001_initial.sql", sql: "CREATE TABLE users();" }],
      })
    ).toEqual([]);
  });

  it("rejects gaps, down migrations, and edits to merged files", () => {
    const errors = validateMigrations({
      files: [
        { name: "0001_initial.sql", sql: "CREATE TABLE users();" },
        {
          name: "0003_rollback.sql",
          sql: "-- down migration\nDROP TABLE users;",
        },
      ],
      changedTrackedFiles: [
        { status: "M", name: "packages/db/migrations/0001_initial.sql" },
      ],
    });
    expect(errors).toHaveLength(3);
  });

  it("requires explicit review for deployment-sensitive contract migrations", () => {
    const changedTrackedFiles = [
      { status: "A", name: "packages/db/migrations/0002_contract.sql" },
    ];
    const unsafe = validateMigrations({
      files: [
        { name: "0001_initial.sql", sql: "CREATE TABLE users();" },
        { name: "0002_contract.sql", sql: "DROP TABLE legacy_users;" },
      ],
      changedTrackedFiles,
    });
    const reviewed = validateMigrations({
      files: [
        { name: "0001_initial.sql", sql: "CREATE TABLE users();" },
        {
          name: "0002_contract.sql",
          sql: "-- deployment-safe-contract: old API stopped reading this table\nDROP TABLE legacy_users;",
        },
      ],
      changedTrackedFiles,
    });
    expect(unsafe).toHaveLength(1);
    expect(reviewed).toEqual([]);
  });

  it.each([
    "DROP VIEW legacy_users;",
    "DROP MATERIALIZED VIEW legacy_stats;",
    "DROP INDEX legacy_users_email_idx;",
    "DROP SCHEMA legacy CASCADE;",
    "ALTER TABLE users DROP CONSTRAINT users_email_key;",
    "ALTER TABLE users RENAME TO legacy_users;",
  ])("recognizes additional contract operation: %s", (sql) => {
    const errors = validateMigrations({
      files: [
        { name: "0001_initial.sql", sql: "CREATE TABLE users();" },
        { name: "0002_contract.sql", sql },
      ],
      changedTrackedFiles: [
        { status: "A", name: "packages/db/migrations/0002_contract.sql" },
      ],
    });

    expect(errors).toHaveLength(1);
  });
});
