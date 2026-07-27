import { pathToFileURL } from "node:url";
import {
  launchRecoveryCampaign,
  RECOVERY_CAMPAIGN,
  recoveryCampaignPreview,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Redacted } from "effect";

export type RecoveryCampaignCommand =
  | { readonly mode: "preview" }
  | { readonly mode: "execute"; readonly confirmation: string };

export const parseRecoveryCampaignCommand = (
  args: readonly string[]
): RecoveryCampaignCommand => {
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

export const validateRecoveryCampaignDatabaseUrl = (rawUrl: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("PRODUCTION_DATABASE_URL is not a valid URL");
  }
  if (!(parsed.protocol === "postgres:" || parsed.protocol === "postgresql:")) {
    throw new Error("PRODUCTION_DATABASE_URL must use PostgreSQL");
  }
  const host = parsed.hostname.toLowerCase();
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
  return rawUrl;
};

const run = async () => {
  const command = parseRecoveryCampaignCommand(process.argv.slice(2));
  const databaseUrl = validateRecoveryCampaignDatabaseUrl(
    process.env.PRODUCTION_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
  );
  const PostgresLive = PgClient.layer({
    url: Redacted.make(databaseUrl),
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: false,
  });

  if (command.mode === "preview") {
    const preview = await Effect.runPromise(
      recoveryCampaignPreview().pipe(Effect.provide(PostgresLive))
    );
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
  const launch = await Effect.runPromise(
    launchRecoveryCampaign({
      apiKey,
      environment: "live_mode",
    }).pipe(Effect.provide(PostgresLive))
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
