import assert from "node:assert/strict";
import test from "node:test";
import { validateProductionDatabaseUrl } from "./validate-production-database-url.mjs";

test("accepts a remote PostgreSQL database", () => {
  const result = validateProductionDatabaseUrl(
    "postgresql://user:secret@db.example.com:5432/delulu?sslmode=require",
    {
      expectedHost: "db.example.com",
      requiredPort: "5432",
      requireTls: true,
    }
  );
  assert.equal(result.hostname, "db.example.com");
  assert.equal(result.pathname, "/delulu");
});

for (const invalid of [
  undefined,
  "not-a-url",
  "https://db.example.com/delulu",
  "postgres://user:secret@localhost:5432/delulu",
  "postgres://user:secret@database.local:5432/delulu",
  "postgres://user:secret@shared-pooler.example.com:5432/delulu?sslmode=require",
  "postgres://user:secret@db.example.com:5432/",
]) {
  test(`rejects unsafe target: ${invalid ?? "missing"}`, () => {
    assert.throws(() => validateProductionDatabaseUrl(invalid));
  });
}

test("rejects a host outside the production allowlist", () => {
  assert.throws(() =>
    validateProductionDatabaseUrl(
      "postgres://user:secret@other.example.com:5432/delulu?sslmode=require",
      { expectedHost: "db.example.com", requireTls: true }
    )
  );
});

test("rejects a production connection without TLS", () => {
  assert.throws(() =>
    validateProductionDatabaseUrl(
      "postgres://user:secret@db.example.com:5432/delulu",
      { expectedHost: "db.example.com", requireTls: true }
    )
  );
});

test("rejects a connection that does not use the direct database port", () => {
  assert.throws(() =>
    validateProductionDatabaseUrl(
      "postgres://user:secret@db.example.com:6432/delulu?sslmode=require",
      {
        expectedHost: "db.example.com",
        requiredPort: "5432",
        requireTls: true,
      }
    )
  );
});
