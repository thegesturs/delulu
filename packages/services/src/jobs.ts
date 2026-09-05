import { JobId, type JobPayload, makeId } from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { type DurableJob, JobTransport } from "./job-transport";

export interface EnqueueJob {
  readonly workspaceId: string;
  readonly payload: JobPayload;
  readonly runAt: Date;
  readonly idempotencyKey: string;
  readonly maxAttempts?: number;
}

/** Job payloads, deadlines, retry state and cancellation live exclusively in DOs. */
export class JobService extends Context.Service<
  JobService,
  {
    readonly enqueue: (input: EnqueueJob) => Effect.Effect<string>;
    readonly cancel: (idempotencyKey: string) => Effect.Effect<void>;
  }
>()("@delulu/services/JobService") {
  static readonly layer = Layer.effect(
    JobService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const transport = yield* JobTransport;
      const prepare = (key: string, job: DurableJob | null) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              const receiptId = crypto.randomUUID();
              // A receipt contains no job data. It proves the surrounding business
              // transaction committed, including when a nested savepoint rolled back.
              const rows = yield* sql<{ transactionId: string }>`
          INSERT INTO execution_receipts (id) VALUES (${receiptId})
          RETURNING pg_current_xact_id()::text AS transaction_id`;
              yield* Effect.promise((signal) =>
                transport.prepare(
                  {
                    key,
                    job,
                    receiptId,
                    transactionId: rows[0].transactionId,
                  },
                  signal
                )
              ).pipe(Effect.timeout("5 seconds"));
            })
          )
          .pipe(Effect.orDie);
      return JobService.of({
        enqueue: (input) => {
          const id = makeId(JobId);
          return prepare(input.idempotencyKey, {
            id,
            workspaceId: input.workspaceId,
            payload: input.payload,
            runAt: input.runAt.getTime(),
            maxAttempts: input.maxAttempts ?? 5,
          }).pipe(Effect.as(id));
        },
        cancel: (key) => prepare(key, null),
      });
    })
  );
}
