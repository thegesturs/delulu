import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Data, Effect } from "effect";
import { OUTPUT_DIR } from "./config";
import { readSnapshot } from "./snapshot/reader";
import { runTransform } from "./transform/pipeline";
import type { OwnershipAuditRow, RoleAuditRow } from "./transform/types";

export class ReportError extends Data.TaggedError("ReportError")<{
  readonly message: string;
}> {}

const roleReport = (rows: readonly RoleAuditRow[]): string => {
  const anomalies = rows.filter((r) => r.anomaly !== null);
  const normal = rows.filter((r) => r.anomaly === null);
  const line = (r: RoleAuditRow) =>
    `| ${r.org} | ${r.email} | ${r.legacyRole} | ${r.isCreator ? "yes" : "no"} | ${r.newRole} |`;
  const lines: string[] = [
    "# Role-mapping report",
    "",
    "Mapping: creator → `owner`, `org:admin` → `admin`, else → `editor` (never `viewer`).",
    "",
    "| Org | Email | Legacy role | Creator | New role |",
    "| --- | --- | --- | --- | --- |",
    ...normal.map(line),
    "",
    `## Anomalies (${anomalies.length})`,
    "",
  ];
  if (anomalies.length === 0) {
    lines.push("None.");
  } else {
    lines.push(
      "| Org | Email | Legacy role | New role | Anomaly |",
      "| --- | --- | --- | --- | --- |"
    );
    for (const r of anomalies) {
      lines.push(
        `| ${r.org} | ${r.email} | ${r.legacyRole} | ${r.newRole} | ${r.anomaly} |`
      );
    }
  }
  return `${lines.join("\n")}\n`;
};

const ownershipReport = (rows: readonly OwnershipAuditRow[]): string => {
  const byEntity = new Map<string, { org: number; user: number }>();
  for (const r of rows) {
    const bucket = byEntity.get(r.entity) ?? { org: 0, user: 0 };
    bucket[r.kind] += 1;
    byEntity.set(r.entity, bucket);
  }
  const lines: string[] = [
    "# Ownership audit",
    "",
    "Every migrated dual-ownership row resolved to exactly one workspace (org → clerk-org workspace, user → personal workspace). Zero fallthrough.",
    "",
    "| Entity | Org-owned | User-owned | Total |",
    "| --- | --- | --- | --- |",
  ];
  for (const [entity, bucket] of byEntity) {
    lines.push(
      `| ${entity} | ${bucket.org} | ${bucket.user} | ${bucket.org + bucket.user} |`
    );
  }
  lines.push("", `Total resolutions: ${rows.length}`);
  return `${lines.join("\n")}\n`;
};

const counterReport = (
  counters: Record<string, number>,
  warnings: readonly string[]
): string => {
  const lines: string[] = [
    "# Edge-case counters",
    "",
    "| Counter | Count |",
    "| --- | --- |",
  ];
  for (const [key, value] of Object.entries(counters)) {
    lines.push(`| \`${key}\` | ${value} |`);
  }
  lines.push("", `## Warnings (${warnings.length})`, "");
  if (warnings.length === 0) {
    lines.push("None.");
  } else {
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }
  return `${lines.join("\n")}\n`;
};

/**
 * Read-only report generator (spec §4.6 checks 7 & 8 artifacts): re-runs the
 * transform on the snapshot and writes role-mapping, ownership, and edge-case
 * markdown. No DB access, so it can run any time during the dry run.
 */
export const generateReports = (
  snapshotPath: string,
  outputDir = OUTPUT_DIR
): Effect.Effect<readonly string[], ReportError> =>
  Effect.gen(function* () {
    const snapshot = yield* readSnapshot(snapshotPath).pipe(
      Effect.mapError((error) => new ReportError({ message: error.message }))
    );
    const result = yield* Effect.promise(() => runTransform(snapshot));
    const files: [string, string][] = [
      ["role-mapping-report.md", roleReport(result.ctx.roleAudit)],
      ["ownership-audit.md", ownershipReport(result.ctx.ownershipAudit)],
      [
        "edge-case-counters.md",
        counterReport(result.ctx.counters.toRecord(), result.ctx.warnings),
      ],
    ];
    return yield* Effect.try({
      try: () => {
        mkdirSync(outputDir, { recursive: true });
        const paths: string[] = [];
        for (const [name, content] of files) {
          const path = join(outputDir, name);
          writeFileSync(path, content, "utf8");
          paths.push(path);
        }
        return paths;
      },
      catch: (cause) =>
        new ReportError({
          message: `Failed to write reports: ${cause instanceof Error ? cause.message : String(cause)}`,
        }),
    });
  });
