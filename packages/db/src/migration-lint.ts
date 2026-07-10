import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const migrationNamePattern = /^\d{4}_[a-z0-9_]+\.sql$/;
const downMigrationPattern = /\bdown\s+migration\b|--\s*down\b|^\s*down\s*:/im;

export interface MigrationLintInput {
  readonly files: ReadonlyArray<{
    readonly name: string;
    readonly sql: string;
  }>;
  readonly changedTrackedFiles?: ReadonlyArray<{
    readonly status: string;
    readonly name: string;
  }>;
}

export const validateMigrations = ({
  files,
  changedTrackedFiles = [],
}: MigrationLintInput): string[] => {
  const errors: string[] = [];
  const sorted = [...files].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  sorted.forEach((file, index) => {
    const expectedPrefix = String(index + 1).padStart(4, "0");
    if (!migrationNamePattern.test(file.name)) {
      errors.push(`${file.name}: expected NNNN_snake_case.sql`);
    } else if (!file.name.startsWith(`${expectedPrefix}_`)) {
      errors.push(`${file.name}: expected sequence ${expectedPrefix}`);
    }
    if (downMigrationPattern.test(file.sql)) {
      errors.push(`${file.name}: down migrations are not allowed`);
    }
  });
  for (const changed of changedTrackedFiles) {
    if (changed.status !== "A") {
      errors.push(`${changed.name}: merged migrations are immutable`);
    }
  }
  return errors;
};

const run = () => {
  const directory = resolve(import.meta.dirname, "../migrations");
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => ({
      name,
      sql: readFileSync(resolve(directory, name), "utf8"),
    }));
  let diff = "";
  try {
    diff = execFileSync(
      "git",
      ["diff", "--name-status", "origin/main", "--", "packages/db/migrations"],
      {
        encoding: "utf8",
      }
    );
  } catch (error) {
    throw new Error("Unable to compare migrations with origin/main", {
      cause: error,
    });
  }
  const changedTrackedFiles = diff
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, name] = line.split("\t");
      return { status: status?.slice(0, 1) ?? "", name: name ?? line };
    });
  const errors = validateMigrations({ files, changedTrackedFiles });
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} forward-only migration(s)`);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
