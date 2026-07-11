import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Data, Effect } from "effect";
import { OUTPUT_DIR } from "./config";
import type { TransformResult } from "./transform/pipeline";
import type { LoadSet, RoleAuditRow } from "./transform/types";

export class ManifestError extends Data.TaggedError("ManifestError")<{
  readonly message: string;
}> {}

export interface CarriedCounters {
  readonly billingOwnerUserId: string;
  readonly monthlyPosts: number;
  readonly mediaStorageBytes: number;
  readonly dmsSent: number;
  readonly transcriptionsUsed: number;
  readonly socialAccounts: number;
}

export interface Manifest {
  readonly version: 1;
  /** Loaded row count per target table. */
  readonly tables: Record<string, number>;
  readonly counters: Record<string, number>;
  readonly warnings: readonly string[];
  readonly roleAudit: readonly RoleAuditRow[];
  readonly ownershipAuditCount: number;
  /** Pre-reconciliation carried counters (verify check 6). */
  readonly subscriptionsCarried: readonly CarriedCounters[];
  readonly reconciliation: {
    readonly subscriptionsUpdated: number;
    readonly reservationsExpired: number;
  };
  readonly triggerIndexRows: number;
}

const TABLE_KEYS: readonly (keyof LoadSet)[] = [
  "users",
  "workspaces",
  "workspaceMembers",
  "connections",
  "media",
  "posts",
  "postTargets",
  "jobs",
  "subscriptions",
  "transactions",
  "postReviews",
  "reviewActivity",
  "automations",
  "automationRuns",
  "automationContacts",
  "transcriptions",
];

export const buildManifest = (
  result: TransformResult,
  reconciliation: { subscriptionsUpdated: number; reservationsExpired: number },
  triggerIndexRows: number
): Manifest => {
  const load = result.ctx.load;
  const tables: Record<string, number> = {};
  for (const key of TABLE_KEYS) {
    tables[key] = load[key].length;
  }
  return {
    version: 1,
    tables,
    counters: result.ctx.counters.toRecord(),
    warnings: result.ctx.warnings,
    roleAudit: result.ctx.roleAudit,
    ownershipAuditCount: result.ctx.ownershipAudit.length,
    subscriptionsCarried: load.subscriptions.map((s) => ({
      billingOwnerUserId: s.billingOwnerUserId,
      monthlyPosts: s.monthlyPosts,
      mediaStorageBytes: s.mediaStorageBytes,
      dmsSent: s.dmsSent,
      transcriptionsUsed: s.transcriptionsUsed,
      socialAccounts: s.socialAccounts,
    })),
    reconciliation,
    triggerIndexRows,
  };
};

export const manifestPath = (dir = OUTPUT_DIR): string =>
  join(dir, "migration_run.json");

export const writeManifest = (
  manifest: Manifest,
  dir = OUTPUT_DIR
): Effect.Effect<string, ManifestError> =>
  Effect.try({
    try: () => {
      mkdirSync(dir, { recursive: true });
      const path = manifestPath(dir);
      writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      return path;
    },
    catch: (cause) =>
      new ManifestError({
        message: `Failed to write manifest: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
  });

export const readManifest = (
  dir = OUTPUT_DIR
): Effect.Effect<Manifest, ManifestError> =>
  Effect.try({
    try: () => JSON.parse(readFileSync(manifestPath(dir), "utf8")) as Manifest,
    catch: (cause) =>
      new ManifestError({
        message: `Failed to read manifest at ${manifestPath(dir)}: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      }),
  });
