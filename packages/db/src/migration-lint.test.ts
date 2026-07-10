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
});
