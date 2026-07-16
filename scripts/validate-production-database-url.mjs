import { pathToFileURL } from "node:url";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export const validateProductionDatabaseUrl = (
  rawUrl,
  { expectedHost, requiredPort, requireTls = false } = {}
) => {
  if (!rawUrl) {
    throw new Error("PRODUCTION_DATABASE_URL is not configured");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("PRODUCTION_DATABASE_URL is not a valid URL");
  }

  if (!(parsed.protocol === "postgres:" || parsed.protocol === "postgresql:")) {
    throw new Error("PRODUCTION_DATABASE_URL must use PostgreSQL");
  }
  if (
    LOCAL_HOSTS.has(parsed.hostname.toLowerCase()) ||
    parsed.hostname.toLowerCase().endsWith(".local")
  ) {
    throw new Error("Production migrations cannot target a local database");
  }
  if (parsed.hostname.toLowerCase().includes("pooler")) {
    throw new Error("Production migrations require a direct database host");
  }
  if (
    expectedHost &&
    parsed.hostname.toLowerCase() !== expectedHost.toLowerCase()
  ) {
    throw new Error("Production migration host does not match the allowlist");
  }
  if (requiredPort && parsed.port !== requiredPort) {
    throw new Error(
      "Production migration port does not match the direct endpoint"
    );
  }
  if (parsed.pathname === "/" || parsed.pathname.length < 2) {
    throw new Error("PRODUCTION_DATABASE_URL must name a database");
  }
  const sslMode = parsed.searchParams.get("sslmode");
  if (
    requireTls &&
    !(
      sslMode === "require" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full"
    )
  ) {
    throw new Error("Production migrations require PostgreSQL TLS");
  }

  return parsed;
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: deployment guard runs outside Turbo
    const expectedHost = process.env.PRODUCTION_DATABASE_HOST;
    if (!expectedHost) {
      throw new Error("PRODUCTION_DATABASE_HOST is not configured");
    }
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: deployment guard runs outside Turbo
    validateProductionDatabaseUrl(process.env.PRODUCTION_DATABASE_URL, {
      expectedHost,
      requiredPort: "5432",
      requireTls: true,
    });
    console.log("Production migration target validated");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Invalid database URL"
    );
    process.exitCode = 1;
  }
}
