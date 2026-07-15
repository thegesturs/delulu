import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPECTED_MIGRATION_HEAD } from "../../src/config";

const migrationIdPattern = /^(\d{4})_[a-z0-9_]+\.sql$/;

describe("migration configuration", () => {
  it("tracks the latest database migration", () => {
    const migrationsDirectory = resolve(
      import.meta.dirname,
      "../../../../packages/db/migrations"
    );
    const migrationIds = readdirSync(migrationsDirectory)
      .map((file) => migrationIdPattern.exec(file))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => Number(match[1]));

    expect(EXPECTED_MIGRATION_HEAD).toBe(Math.max(...migrationIds));
  });
});
