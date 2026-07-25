import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(import.meta.dirname, "../migrations/0004_automations_webhooks.sql"),
  "utf8"
);
const initialMigration = readFileSync(
  resolve(import.meta.dirname, "../migrations/0001_initial_schema.sql"),
  "utf8"
);
const targetingMigration = readFileSync(
  resolve(
    import.meta.dirname,
    "../migrations/0012_automation_target_modes.sql"
  ),
  "utf8"
);

describe("automation and webhook migration", () => {
  it("enforces durable replay and DM deduplication keys", () => {
    expect(migration).toContain("UNIQUE (provider, event_id)");
    expect(migration).toContain(
      "PRIMARY KEY (provider, event_id, automation_id, platform_user_id, step_id)"
    );
  });

  it("separates in-flight reservations from sent and skipped counters", () => {
    expect(migration).toContain("dms_reserved bigint NOT NULL DEFAULT 0");
    expect(initialMigration).toContain("dms_skipped bigint NOT NULL DEFAULT 0");
  });

  it("migrates targeting and enforces idempotent comment replies", () => {
    expect(targetingMigration).toContain("trigger->'pendingPostIds'");
    expect(targetingMigration).toContain(
      "PRIMARY KEY (provider, event_id, automation_id)"
    );
    expect(targetingMigration).toContain("external_submission_id");
  });
});
