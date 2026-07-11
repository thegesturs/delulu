export interface CheckResult {
  readonly name: string;
  readonly pass: boolean;
  readonly details: readonly string[];
}

export const ok = (
  name: string,
  details: readonly string[] = []
): CheckResult => ({
  name,
  pass: true,
  details,
});

export const fail = (
  name: string,
  details: readonly string[]
): CheckResult => ({
  name,
  pass: false,
  details,
});

export interface AllowList {
  /** billingOwnerUserId (legacy convex id) → accepted counter diffs (documented). */
  readonly quotaDiffs?: readonly string[];
}
