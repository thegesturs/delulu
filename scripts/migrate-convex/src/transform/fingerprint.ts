import { contentFingerprint } from "@delulu/core";

/** Deterministic key for deep-comparing legacy content variants (alt dedup). */
export const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)])
    );
  }
  return value;
};

export const canonicalKey = (value: unknown): string =>
  JSON.stringify(canonical(value));

/**
 * SHA-256 fingerprint of the migrated content graph, using the exact same
 * function the app uses (`packages/core/src/domain/post-behavior.ts`) so review
 * fingerprints agree with what the running system would compute.
 */
export const fingerprintOf = (content: {
  readonly groups: readonly unknown[];
}): Promise<string> => contentFingerprint(content);
