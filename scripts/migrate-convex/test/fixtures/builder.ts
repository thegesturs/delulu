import { strToU8, zipSync } from "fflate";

export type FixtureTables = Record<string, readonly unknown[]>;

/**
 * Build an in-memory Convex-export ZIP from a `{ table: docs[] }` map, matching
 * the `<table>/documents.jsonl` layout the reader expects.
 */
export const buildSnapshotZip = (tables: FixtureTables): Uint8Array => {
  const files: Record<string, Uint8Array> = {};
  for (const [table, docs] of Object.entries(tables)) {
    const jsonl =
      docs.map((doc) => JSON.stringify(doc)).join("\n") +
      (docs.length > 0 ? "\n" : "");
    files[`${table}/documents.jsonl`] = strToU8(jsonl);
  }
  // Convex archives also carry a `_tables/documents.jsonl`; include it so the
  // reader's system-table skip is exercised.
  files["_tables/documents.jsonl"] = strToU8("");
  return zipSync(files);
};
