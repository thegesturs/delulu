import assert from "node:assert/strict";
import test from "node:test";
import { runCloudflareProductionMigration } from "./run-cloudflare-production-migration.mjs";

const databaseUrl =
  "postgresql://user:secret@db.example.com:5432/delulu?sslmode=require";

test("runs migrations for the production branch", () => {
  let receivedUrl;
  const result = runCloudflareProductionMigration({
    branch: "main",
    databaseUrl,
    expectedHost: "db.example.com",
    runMigration: (value) => {
      receivedUrl = value;
    },
  });
  assert.deepEqual(result, { migrated: true });
  assert.equal(receivedUrl, databaseUrl);
});

test("skips migrations for preview branches before reading secrets", () => {
  let called = false;
  const result = runCloudflareProductionMigration({
    branch: "feature/test",
    databaseUrl: undefined,
    expectedHost: undefined,
    runMigration: () => {
      called = true;
    },
  });
  assert.deepEqual(result, {
    migrated: false,
    reason: "non-production-branch",
  });
  assert.equal(called, false);
});

test("fails closed when Workers branch metadata is missing", () => {
  assert.throws(() =>
    runCloudflareProductionMigration({
      branch: undefined,
      databaseUrl: undefined,
      expectedHost: undefined,
      runMigration: () => undefined,
    })
  );
});

test("blocks production when the target is invalid", () => {
  assert.throws(() =>
    runCloudflareProductionMigration({
      branch: "main",
      databaseUrl:
        "postgresql://user:secret@shared-pooler.example.com/delulu?sslmode=require",
      expectedHost: "shared-pooler.example.com",
      runMigration: () => undefined,
    })
  );
});
