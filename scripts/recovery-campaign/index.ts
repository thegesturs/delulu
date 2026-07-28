import { pathToFileURL } from "node:url";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Redacted } from "effect";
import type { SqlClient } from "effect/unstable/sql";
import { isSqlError } from "effect/unstable/sql/SqlError";
import {
  launchRecoveryCampaign,
  RECOVERY_CAMPAIGN,
  recoveryCampaignPreview,
} from "./campaign";

type RecoveryCampaignCommand =
  | { readonly mode: "help" }
  | { readonly mode: "preview" }
  | { readonly mode: "execute"; readonly confirmation: string };

const parseRecoveryCampaignCommand = (
  args: readonly string[]
): RecoveryCampaignCommand => {
  if (args.includes("--help") || args.includes("-h")) {
    return { mode: "help" };
  }
  const execute = args.includes("--execute");
  const confirmation = args
    .find((arg) => arg.startsWith("--confirm="))
    ?.slice("--confirm=".length);
  if (!execute) {
    if (confirmation) {
      throw new Error("--confirm can only be used together with --execute");
    }
    return { mode: "preview" };
  }
  if (confirmation !== RECOVERY_CAMPAIGN.id) {
    throw new Error(`Execution requires --confirm=${RECOVERY_CAMPAIGN.id}`);
  }
  return { mode: "execute", confirmation };
};

const validateRecoveryCampaignDatabaseUrl = (rawUrl: string): URL => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("PRODUCTION_DATABASE_URL is not a valid URL");
  }
  if (!(parsed.protocol === "postgres:" || parsed.protocol === "postgresql:")) {
    throw new Error("PRODUCTION_DATABASE_URL must use PostgreSQL");
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local")
  ) {
    throw new Error("The recovery campaign cannot target a local database");
  }
  if (parsed.pathname === "/" || parsed.pathname.length < 2) {
    throw new Error("PRODUCTION_DATABASE_URL must name a database");
  }
  const sslMode = parsed.searchParams.get("sslmode");
  if (sslMode && !["require", "verify-ca", "verify-full"].includes(sslMode)) {
    throw new Error(
      "PRODUCTION_DATABASE_URL must use sslmode=require, verify-ca, or verify-full"
    );
  }
  return parsed;
};

const run = async () => {
  const command = parseRecoveryCampaignCommand(process.argv.slice(2));
  if (command.mode === "help") {
    console.log(`Recovery campaign

Preview:
  PRODUCTION_DATABASE_URL='postgres://...?sslmode=require' pnpm campaign:recovery

Execute:
  PRODUCTION_DATABASE_URL='postgres://...?sslmode=require' \\
  DODO_PAYMENTS_API_KEY=... \\
  DODO_PAYMENTS_ENVIRONMENT=live_mode \\
  pnpm campaign:recovery -- --execute --confirm=${RECOVERY_CAMPAIGN.id}`);
    return;
  }
  const rawDatabaseUrl = process.env.PRODUCTION_DATABASE_URL;
  if (!rawDatabaseUrl) {
    throw new Error(
      "PRODUCTION_DATABASE_URL is required. Run `pnpm campaign:recovery -- --help` for the exact command."
    );
  }
  const databaseUrl = validateRecoveryCampaignDatabaseUrl(rawDatabaseUrl);
  const databaseTarget = `${databaseUrl.hostname}:${databaseUrl.port || "5432"}`;
  databaseUrl.searchParams.delete("sslmode");
  databaseUrl.searchParams.delete("sslrootcert");
  databaseUrl.searchParams.delete("sslcert");
  databaseUrl.searchParams.delete("sslkey");
  const PostgresLive = PgClient.layer({
    url: Redacted.make(databaseUrl.toString()),
    connectTimeout: "5 seconds",
    ssl: {
      rejectUnauthorized: true,
      servername: databaseUrl.hostname,
    },
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: false,
  });
  const runWithDatabase = async <A, E>(
    effect: Effect.Effect<A, E, SqlClient.SqlClient>
  ) => {
    try {
      return await Effect.runPromise(effect.pipe(Effect.provide(PostgresLive)));
    } catch (error) {
      if (!isSqlError(error) || error.reason.operation !== "connect") {
        throw error;
      }
      const cause = error.reason.cause;
      const reason = cause instanceof Error ? cause.message : error.message;
      throw new Error(
        `Cannot connect to the production PostgreSQL database at ${databaseTarget}: ${reason}\n` +
          "Verify PRODUCTION_DATABASE_URL credentials and confirm your network or IP allowlist permits a direct database connection."
      );
    }
  };

  if (command.mode === "preview") {
    const preview = await runWithDatabase(recoveryCampaignPreview());
    console.log(JSON.stringify({ mode: command.mode, ...preview }, null, 2));
    return;
  }

  if (process.env.DODO_PAYMENTS_ENVIRONMENT !== "live_mode") {
    throw new Error(
      "DODO_PAYMENTS_ENVIRONMENT must be live_mode for execution"
    );
  }
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is required for execution");
  }
  const launch = await runWithDatabase(
    launchRecoveryCampaign({
      apiKey,
      environment: "live_mode",
    })
  );
  console.log(JSON.stringify({ mode: command.mode, ...launch }, null, 2));
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Recovery campaign failed"
    );
    process.exitCode = 1;
  });
}
