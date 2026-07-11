import { Effect } from "effect";
import { LEGACY_SCHEMAS } from "./legacy";
import { type DecodeIssue, decodeTable } from "./legacy/decode";
import { readSnapshot, type Snapshot } from "./snapshot/reader";
import { KNOWN_TABLES, TABLE_SPECS } from "./snapshot/tables";

export interface TableCount {
  readonly table: string;
  readonly count: number;
  readonly disposition: string;
  readonly note: string;
  readonly decoded: number;
  readonly decodeErrors: number;
}

export interface InspectReport {
  readonly tables: readonly TableCount[];
  /** Tables present in the snapshot but not in our canonical list. */
  readonly unknownTables: readonly {
    readonly table: string;
    readonly count: number;
  }[];
  /** Known tables absent from the snapshot (informational). */
  readonly missingTables: readonly string[];
  readonly decodeErrors: readonly DecodeIssue[];
  readonly totalDocuments: number;
}

export const buildInspectReport = (snapshot: Snapshot): InspectReport => {
  const tables: TableCount[] = [];
  const decodeErrors: DecodeIssue[] = [];
  let totalDocuments = 0;

  for (const spec of TABLE_SPECS) {
    const docs = snapshot.tables.get(spec.convex) ?? [];
    totalDocuments += docs.length;
    const schema = LEGACY_SCHEMAS[spec.convex];
    let decoded = docs.length;
    let errorCount = 0;
    if (schema) {
      const result = decodeTable(schema, spec.convex, docs);
      decoded = result.ok.length;
      errorCount = result.errors.length;
      decodeErrors.push(...result.errors);
    }
    tables.push({
      table: spec.convex,
      count: docs.length,
      disposition: spec.disposition,
      note: spec.note,
      decoded,
      decodeErrors: errorCount,
    });
  }

  const unknownTables: { table: string; count: number }[] = [];
  for (const [table, docs] of snapshot.tables) {
    if (!KNOWN_TABLES.has(table)) {
      unknownTables.push({ table, count: docs.length });
      totalDocuments += docs.length;
    }
  }

  const missingTables = TABLE_SPECS.filter(
    (spec) => !snapshot.tables.has(spec.convex)
  ).map((spec) => spec.convex);

  return {
    tables,
    unknownTables,
    missingTables,
    decodeErrors,
    totalDocuments,
  };
};

const pad = (value: string, width: number): string => value.padEnd(width);

export const formatInspectReport = (report: InspectReport): string => {
  const lines: string[] = [];
  lines.push("Convex snapshot inspection");
  lines.push("==========================");
  lines.push("");
  lines.push(
    `${pad("TABLE", 24)}${pad("COUNT", 9)}${pad("DECODED", 9)}${pad("ERRORS", 8)}DISPOSITION`
  );
  for (const table of report.tables) {
    lines.push(
      `${pad(table.table, 24)}${pad(String(table.count), 9)}${pad(
        String(table.decoded),
        9
      )}${pad(String(table.decodeErrors), 8)}${table.disposition} — ${table.note}`
    );
  }
  lines.push("");
  lines.push(`Total documents: ${report.totalDocuments}`);

  if (report.unknownTables.length > 0) {
    lines.push("");
    lines.push(
      "Unknown tables (not in canonical list — will NOT be migrated):"
    );
    for (const unknown of report.unknownTables) {
      lines.push(`  - ${unknown.table} (${unknown.count} docs)`);
    }
  }
  if (report.missingTables.length > 0) {
    lines.push("");
    lines.push(
      `Tables absent from snapshot: ${report.missingTables.join(", ")}`
    );
  }
  if (report.decodeErrors.length > 0) {
    lines.push("");
    lines.push(`Decode errors (${report.decodeErrors.length}):`);
    for (const issue of report.decodeErrors.slice(0, 100)) {
      lines.push(`  - ${issue.table}/${issue.id}: ${issue.message}`);
    }
    if (report.decodeErrors.length > 100) {
      lines.push(`  … ${report.decodeErrors.length - 100} more`);
    }
  } else {
    lines.push("");
    lines.push("Decode errors: none");
  }
  return lines.join("\n");
};

export const runInspect = (
  snapshotPath: string
): Effect.Effect<InspectReport, import("./snapshot/reader").SnapshotError> =>
  Effect.gen(function* () {
    const snapshot = yield* readSnapshot(snapshotPath);
    const report = buildInspectReport(snapshot);
    yield* Effect.log(formatInspectReport(report));
    return report;
  });
