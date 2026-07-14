import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateProductionDatabaseUrl } from "./validate-production-database-url.mjs";

export const runCloudflareProductionMigration = ({
  branch,
  databaseUrl,
  expectedHost,
  runMigration,
}) => {
  if (!branch) {
    throw new Error("WORKERS_CI_BRANCH is not configured");
  }
  if (branch !== "main") {
    return { migrated: false, reason: "non-production-branch" };
  }
  if (!expectedHost) {
    throw new Error("PRODUCTION_DATABASE_HOST is not configured");
  }
  validateProductionDatabaseUrl(databaseUrl, {
    expectedHost,
    requiredPort: "5432",
    requireTls: true,
  });
  runMigration(databaseUrl);
  return { migrated: true };
};

const executeMigration = (databaseUrl) => {
  const result = spawnSync("pnpm", ["pg:migrate"], {
    cwd: resolve(import.meta.dirname, ".."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
  if (result.error) {
    throw new Error("Unable to start production migration", {
      cause: result.error,
    });
  }
  if (result.status !== 0) {
    throw new Error("Production migration failed");
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: provided by Workers Builds
    const branch = process.env.WORKERS_CI_BRANCH;
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: Workers build secret
    const databaseUrl = process.env.PRODUCTION_DATABASE_URL;
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: Workers build variable
    const expectedHost = process.env.PRODUCTION_DATABASE_HOST;
    const result = runCloudflareProductionMigration({
      branch,
      databaseUrl,
      expectedHost,
      runMigration: executeMigration,
    });
    console.log(
      result.migrated
        ? "Production migrations applied"
        : `Production migration skipped: ${result.reason}`
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Production migration failed"
    );
    process.exitCode = 1;
  }
}
