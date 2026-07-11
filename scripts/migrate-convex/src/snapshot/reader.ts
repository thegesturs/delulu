import { readFileSync } from "node:fs";
import { Data, Effect } from "effect";
import yauzl from "yauzl";

export class SnapshotError extends Data.TaggedError("SnapshotError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** Raw per-table documents keyed by Convex table name (system tables excluded). */
export interface Snapshot {
  readonly tables: ReadonlyMap<string, readonly unknown[]>;
}

/** `npx convex export` lays each table out as `<table>/documents.jsonl`. */
const DOCUMENTS_RE = /^(?<table>[^/]+)\/documents\.jsonl$/;

const parseJsonl = (text: string, table: string): unknown[] => {
  const docs: unknown[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed.length === 0) {
      continue;
    }
    try {
      docs.push(JSON.parse(trimmed));
    } catch (cause) {
      throw new Error(
        `Malformed JSONL in ${table}/documents.jsonl line ${index + 1}: ${
          cause instanceof Error ? cause.message : String(cause)
        }`
      );
    }
  }
  return docs;
};

/**
 * Parse an in-memory Convex-export ZIP into a snapshot. Uses `yauzl` because
 * real Convex exports are **zip64** — fflate's `unzipSync` mis-reads the zip64
 * size fields (returns the 0xFFFFFFFF sentinel) and blows up. Rejects on a
 * malformed archive or malformed JSONL.
 */
export const parseSnapshotBuffer = (bytes: Buffer): Promise<Snapshot> =>
  new Promise((resolve, reject) => {
    yauzl.fromBuffer(bytes, { lazyEntries: true }, (openErr, zip) => {
      if (openErr || !zip) {
        reject(openErr ?? new Error("Unable to open ZIP archive"));
        return;
      }
      const tables = new Map<string, readonly unknown[]>();
      zip.on("error", reject);
      zip.on("end", () => resolve({ tables }));
      zip.on("entry", (entry: yauzl.Entry) => {
        const table = DOCUMENTS_RE.exec(entry.fileName)?.groups?.table;
        // Skip Convex system tables (`_tables`, `_storage`, `_components/…`) and
        // non-document entries (per-table `generated_schema.jsonl`, blobs).
        if (!table || table.startsWith("_")) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) {
            reject(streamErr ?? new Error(`Unable to read ${entry.fileName}`));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () => {
            try {
              tables.set(
                table,
                parseJsonl(Buffer.concat(chunks).toString("utf8"), table)
              );
            } catch (parseErr) {
              reject(parseErr);
              return;
            }
            zip.readEntry();
          });
        });
      });
      zip.readEntry();
    });
  });

export const readSnapshot = (
  path: string
): Effect.Effect<Snapshot, SnapshotError> =>
  Effect.tryPromise({
    try: () => parseSnapshotBuffer(readFileSync(path)),
    catch: (cause) =>
      new SnapshotError({
        message: `Failed to read snapshot at ${path}: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
        cause,
      }),
  });
