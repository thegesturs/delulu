import { Schema } from "effect";

/**
 * Throwaway Effect Schemas mirroring the Convex document shapes. They live in
 * the migrator (not `@delulu/database`) so the CLI survives deletion of the
 * Convex package after the soak. `Schema.Struct` ignores excess properties on
 * decode, so deprecated/unmodelled legacy fields pass through harmlessly.
 */

/** Convex system fields present on every exported document. */
export const SystemFields = {
  _id: Schema.String,
  /** Creation time in epoch milliseconds (float). */
  _creationTime: Schema.Number,
};

export interface LegacyDoc {
  readonly _id: string;
  readonly _creationTime: number;
}
