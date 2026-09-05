/** One-time cutover only. Requires the old scheduler and publisher to be stopped. */

import { JobPayload } from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import {
  Effect,
  String as EffectString,
  Layer,
  Redacted,
  Schema,
} from "effect";
import { SqlClient } from "effect/unstable/sql";
import { JobTransport } from "../src/job-transport";
import { JobService } from "../src/jobs";

if (!process.argv.includes("--old-workers-stopped")) {
  throw new Error(
    "Stop the old API cron, Node publisher and SQS consumer, then pass --old-workers-stopped"
  );
}
const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};
const endpoint = new URL("/internal/jobs", required("SCHEDULER_URL"));
if (endpoint.protocol !== "https:") {
  throw new Error("Scheduler requires HTTPS");
}
const secret = required("SCHEDULER_SECRET");
const Pg = PgClient.layer({
  url: Redacted.make(required("DATABASE_URL")),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: false,
});
const Transport = Layer.succeed(
  JobTransport,
  JobTransport.of({
    prepare: async (intent, signal) => {
      const response = await fetch(endpoint, {
        signal: signal ?? AbortSignal.timeout(30_000),
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(intent),
      });
      if (!response.ok) {
        throw new Error(
          `Scheduler rejected cutover intent: ${response.status}`
        );
      }
    },
  })
);
const Jobs = JobService.layer.pipe(Layer.provide([Pg, Transport]));
await Effect.runPromise(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const jobs = yield* JobService;
    let transferred = 0;
    // Receipt DDL is additive and must precede the final retirement migration.
    yield* sql`CREATE TABLE IF NOT EXISTS execution_receipts (id uuid PRIMARY KEY)`;
    while (true) {
      const count = yield* sql.withTransaction(
        Effect.gen(function* () {
          const batch = yield* sql<{
            id: string;
            workspaceId: string;
            payload: unknown;
            runAt: Date;
            maxAttempts: number;
            idempotencyKey: string;
          }>`
        SELECT id, workspace_id, payload, run_at, max_attempts, idempotency_key FROM jobs
        WHERE status IN ('pending','leased','dispatched') ORDER BY run_at, id LIMIT 100 FOR UPDATE`;
          for (const row of batch) {
            yield* jobs.enqueue({
              workspaceId: row.workspaceId,
              payload: Schema.decodeUnknownSync(JobPayload)(row.payload),
              runAt: row.runAt,
              maxAttempts: row.maxAttempts,
              idempotencyKey: row.idempotencyKey,
            });
            yield* sql`DELETE FROM jobs WHERE id = ${row.id}`;
          }
          return batch.length;
        })
      );
      transferred += count;
      if (!count) {
        break;
      }
    }
    // These are one-time source inventories. Runtime execution never scans them.
    const owners = yield* sql<{
      id: string;
    }>`SELECT billing_owner_user_id AS id FROM subscriptions WHERE status IN ('active','trialing')`;
    for (const owner of owners) {
      yield* jobs.enqueue({
        workspaceId: owner.id,
        payload: { _tag: "LifecycleDeadline", ownerId: owner.id },
        runAt: new Date(),
        idempotencyKey: `lifecycle:${owner.id}`,
      });
      yield* jobs.enqueue({
        workspaceId: owner.id,
        payload: { _tag: "BillingReconcile", ownerId: owner.id },
        runAt: new Date(),
        idempotencyKey: `billing-reconcile:${owner.id}`,
      });
    }
    const cancellations = yield* sql<{
      id: string;
      ownerId: string;
    }>`SELECT id, billing_owner_user_id AS owner_id FROM cancellation_requests WHERE status IN ('scheduled','effective','deleting')`;
    for (const row of cancellations) {
      yield* jobs.enqueue({
        workspaceId: row.ownerId,
        payload: { _tag: "CancellationDeadline", requestId: row.id },
        runAt: new Date(),
        idempotencyKey: `cancellation:${row.id}`,
      });
    }
    const reservations = yield* sql<{
      id: string;
      ownerId: string;
      expiresAt: Date;
    }>`SELECT id, billing_owner_user_id AS owner_id, expires_at FROM quota_reservations WHERE status = 'pending'`;
    for (const row of reservations) {
      yield* jobs.enqueue({
        workspaceId: row.ownerId,
        payload: { _tag: "ExpireReservation", reservationId: row.id },
        runAt: row.expiresAt,
        idempotencyKey: `expire-reservation:${row.id}`,
      });
    }
    const messages = yield* sql<{
      id: string;
      userId: string;
      nextAttemptAt: Date;
      maxAttempts: number;
    }>`SELECT id, user_id, next_attempt_at, max_attempts FROM message_deliveries WHERE status IN ('queued','failed','leased')`;
    for (const row of messages) {
      yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* jobs.enqueue({
            workspaceId: row.userId,
            payload: { _tag: "DeliverMessage", messageId: row.id },
            runAt: row.nextAttemptAt,
            maxAttempts: row.maxAttempts,
            idempotencyKey: `message:${row.id}`,
          });
          yield* sql`UPDATE message_deliveries SET status = 'queued' WHERE id = ${row.id} AND status = 'leased'`;
        })
      );
    }
    const repairs = yield* sql<{
      profileId: string;
      mediaId: string;
    }>`SELECT profile_id, media_id FROM automation_trigger_repairs`;
    for (const row of repairs) {
      yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* jobs.enqueue({
            workspaceId: row.profileId,
            payload: { _tag: "RepairAutomation", ...row },
            runAt: new Date(),
            idempotencyKey: `automation-repair:${row.profileId}:${row.mediaId}`,
          });
          yield* sql`DELETE FROM automation_trigger_repairs WHERE profile_id = ${row.profileId} AND media_id = ${row.mediaId}`;
        })
      );
    }
    yield* sql`INSERT INTO execution_receipts (id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING`;
    yield* Effect.log({
      transferred,
      owners: owners.length,
      cancellations: cancellations.length,
      reservations: reservations.length,
      messages: messages.length,
      repairs: repairs.length,
    });
  }).pipe(Effect.provide(Layer.mergeAll(Pg, Jobs)))
);
