import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { PostHog } from "posthog-node";
import { readCredentials } from "./config.js";

// Canonical event name — mirrors `CLI_COMMAND_INVOKED` in the shared registry
// (packages/analytics/events.ts). Defined inline rather than imported: the CLI
// runs unbundled under Node ESM, where importing the CJS-transpiled `events.ts`
// (that package has no `"type":"module"`) drops most named exports via CJS
// interop. The API and worker bundle the registry with esbuild, so they import
// it directly.
const CLI_COMMAND_INVOKED = "cli_command_invoked";

/**
 * CLI usage analytics (PostHog). Deliberately metadata-only: we record which
 * command ran, whether it succeeded, and how long it took — never captions,
 * media ids, or any argument values. This is what answers "are people using the
 * CLI vs the app" (via the `platform: "cli"` property) and which CLI commands
 * matter, unified with web/app on the same person (Clerk user id).
 */

// Public PostHog project key — the same client key already shipped in the web
// and app bundles. Overridable via env for self-hosted/testing.
const DEFAULT_POSTHOG_KEY = "phc_A5NWdEHAyUyzoUUSKnemshpamt3MCdbh9ztSxH0RvQV";
const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

const optedOut =
  process.env.DELULU_TELEMETRY_DISABLED === "1" ||
  process.env.DO_NOT_TRACK === "1";

const apiKey = process.env.DELULU_POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY;

const client =
  optedOut || !apiKey
    ? null
    : new PostHog(apiKey, {
        host: process.env.DELULU_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      });

let invokedCommand = "unknown";
let startedAt = Date.now();

/** Record the command about to run (called from Commander's `preAction` hook). */
export function trackCommand(command: string): void {
  invokedCommand = command;
  startedAt = Date.now();
}

/** Decode the Clerk user id (`sub`) from the stored access token, unverified. */
function decodeSub(accessToken: string): string | null {
  const part = accessToken.split(".")[1];
  if (!part) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(part, "base64url").toString("utf8")
    ) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Stable per-machine id for anonymous (logged-out) CLI usage — no PII. */
async function getOrCreateAnonId(): Promise<string> {
  const path = join(homedir(), ".config", "delulu", "telemetry-id");
  try {
    const existing = (await readFile(path, "utf8")).trim();
    if (existing) {
      return existing;
    }
  } catch {
    // Not created yet.
  }
  const id = `cli-anon-${randomUUID()}`;
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${id}\n`, { mode: 0o600 });
  } catch {
    // Best-effort; fall back to the ephemeral id for this run.
  }
  return id;
}

let cachedDistinctId: string | undefined;
async function resolveDistinctId(): Promise<string> {
  if (cachedDistinctId !== undefined) {
    return cachedDistinctId;
  }
  const credentials = await readCredentials();
  const sub = credentials ? decodeSub(credentials.accessToken) : null;
  cachedDistinctId = sub ?? (await getOrCreateAnonId());
  return cachedDistinctId;
}

/** Capture the invocation outcome. Never throws. */
export async function reportInvocation(success: boolean): Promise<void> {
  if (!client) {
    return;
  }
  try {
    const distinctId = await resolveDistinctId();
    client.capture({
      distinctId,
      event: CLI_COMMAND_INVOKED,
      properties: {
        platform: "cli",
        cli_version: process.env.npm_package_version ?? "unknown",
        command: invokedCommand,
        success,
        duration_ms: Date.now() - startedAt,
      },
    });
  } catch {
    // Telemetry must never affect CLI behavior.
  }
}

/** Flush any buffered events before the process exits. Never throws. */
export async function shutdownTelemetry(): Promise<void> {
  if (client) {
    await client.shutdown().catch(() => {
      // Best-effort flush.
    });
  }
}
