import { type EntityIdSchema, makeId, toTimestamp } from "@delulu/core";

/**
 * One `convexId → Nano ID` map per entity type. Ids are minted lazily so a
 * reference can be resolved before the owning row is transformed; every run
 * mints fresh ids (idempotency is by truncate-and-reload, not id stability).
 */
export interface IdMap<A extends string> {
  readonly getOrCreate: (convexId: string) => A;
  readonly get: (convexId: string) => A | undefined;
  readonly set: (convexId: string, id: A) => void;
  readonly has: (convexId: string) => boolean;
  readonly entries: () => IterableIterator<[string, A]>;
  readonly size: () => number;
}

export const makeIdMap = <A>(schema: EntityIdSchema<A>): IdMap<A & string> => {
  const map = new Map<string, A & string>();
  return {
    getOrCreate: (convexId) => {
      let id = map.get(convexId);
      if (id === undefined) {
        id = makeId(schema) as A & string;
        map.set(convexId, id);
      }
      return id;
    },
    get: (convexId) => map.get(convexId),
    set: (convexId, id) => {
      map.set(convexId, id as A & string);
    },
    has: (convexId) => map.has(convexId),
    entries: () => map.entries(),
    size: () => map.size,
  };
};

/** Convex `_creationTime`/epoch-ms → Date (timestamptz). */
export const epochToDate = (ms: number | undefined | null): Date | null =>
  ms === undefined || ms === null ? null : toTimestamp(ms);

/** Non-null variant for required timestamps; falls back to `_creationTime`. */
export const epochToDateOr = (
  ms: number | undefined | null,
  fallback: number
): Date => toTimestamp(ms ?? fallback);
