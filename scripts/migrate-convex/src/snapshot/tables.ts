/**
 * Canonical Convex table list and disposition per spec §4.5. Drives the
 * `inspect` counts (unknown tables are flagged) and the row-count parity check.
 */

export type Disposition = "transform" | "migrate" | "drop" | "rebuild";

export interface TableSpec {
  /** Convex source table name (as it appears in the export ZIP). */
  readonly convex: string;
  readonly disposition: Disposition;
  /** Short human note for the inspect/report output. */
  readonly note: string;
}

export const TABLE_SPECS: readonly TableSpec[] = [
  {
    convex: "users",
    disposition: "transform",
    note: "→ users + synthesized personal workspace + owner member",
  },
  {
    convex: "organizations",
    disposition: "transform",
    note: "→ workspaces (clerk_org_id kept)",
  },
  {
    convex: "organizationMembers",
    disposition: "transform",
    note: "→ workspace_members (role mapping)",
  },
  {
    convex: "socialProviders",
    disposition: "transform",
    note: "→ connections (ciphertext verbatim)",
  },
  { convex: "media", disposition: "transform", note: "→ media (status=ready)" },
  {
    convex: "posts",
    disposition: "transform",
    note: "→ posts + content groups + targets + jobs",
  },
  {
    convex: "postReviews",
    disposition: "transform",
    note: "→ post_reviews (one cycling row)",
  },
  {
    convex: "reviewActivity",
    disposition: "transform",
    note: "→ review_activity",
  },
  {
    convex: "subscriptions",
    disposition: "transform",
    note: "→ subscriptions (selected plan row)",
  },
  {
    convex: "transactions",
    disposition: "migrate",
    note: "→ transactions (straight copy)",
  },
  { convex: "automations", disposition: "transform", note: "→ automations" },
  {
    convex: "automationLogs",
    disposition: "transform",
    note: "→ automation_runs",
  },
  {
    convex: "automationContacts",
    disposition: "transform",
    note: "→ automation_contacts (placeholder rule)",
  },
  {
    convex: "transcriptions",
    disposition: "transform",
    note: "→ transcriptions (personal workspace)",
  },
  {
    convex: "automationMediaTriggers",
    disposition: "rebuild",
    note: "rebuilt via rebuild-index (dropped from snapshot)",
  },
  {
    convex: "apiKeys",
    disposition: "drop",
    note: "re-minted under #149 workspace-bound model",
  },
  {
    convex: "automationSessions",
    disposition: "drop",
    note: "ephemeral mid-conversation state",
  },
  {
    convex: "articles",
    disposition: "drop",
    note: "marketing blog content already served from Workers KV; Convex copy is a stale dump",
  },
  {
    convex: "accountInsights",
    disposition: "drop",
    note: "#158 live passthrough",
  },
  {
    convex: "mediaInsights",
    disposition: "drop",
    note: "#158 live passthrough",
  },
  {
    convex: "analyticsSyncState",
    disposition: "drop",
    note: "#158 sync worker retired",
  },
];

export const KNOWN_TABLES: ReadonlySet<string> = new Set(
  TABLE_SPECS.map((spec) => spec.convex)
);

export const specFor = (convex: string): TableSpec | undefined =>
  TABLE_SPECS.find((spec) => spec.convex === convex);
