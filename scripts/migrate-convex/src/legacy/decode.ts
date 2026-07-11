import { Schema } from "effect";

export interface DecodeIssue {
  readonly table: string;
  readonly id: string;
  readonly message: string;
}

export interface DecodeResult<A> {
  readonly ok: readonly A[];
  readonly errors: readonly DecodeIssue[];
}

const idOf = (doc: unknown): string =>
  typeof doc === "object" && doc !== null && "_id" in doc
    ? String((doc as { _id: unknown })._id)
    : "<no _id>";

/**
 * Decode every raw document against `schema`, collecting successes and failures
 * separately. Each failure carries the source table and Convex `_id` so the
 * dry run can pinpoint the malformed document (spec §4.6, PR1 acceptance).
 */
export const decodeTable = <A>(
  schema: Schema.Codec<A>,
  table: string,
  docs: readonly unknown[]
): DecodeResult<A> => {
  const decode = Schema.decodeUnknownSync(schema);
  const ok: A[] = [];
  const errors: DecodeIssue[] = [];
  for (const doc of docs) {
    try {
      ok.push(decode(doc));
    } catch (cause) {
      errors.push({
        table,
        id: idOf(doc),
        message: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }
  return { ok, errors };
};

/** Decode-or-throw with a table/id-qualified message. Used where decode failure is fatal. */
export const decodeTableOrThrow = <A>(
  schema: Schema.Codec<A>,
  table: string,
  docs: readonly unknown[]
): readonly A[] => {
  const { ok, errors } = decodeTable(schema, table, docs);
  if (errors.length > 0) {
    const [first] = errors;
    throw new Error(
      `Decode failed for ${errors.length} ${table} document(s); first: ${table}/${first.id}: ${first.message}`
    );
  }
  return ok;
};
