import { JobId, JobPayload, makeId, WorkspaceId } from "@delulu/core";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

export interface ClaimedJob {
  readonly id: string;
  readonly workspaceId: WorkspaceId;
  readonly payload: JobPayload;
  readonly attempts: number;
  readonly maxAttempts: number;
}

const ClaimedJobRow = Schema.Struct({
  id: Schema.String,
  workspaceId: WorkspaceId,
  payload: Schema.Unknown,
  attempts: Schema.Number,
  maxAttempts: Schema.Number,
});

/** Durable transactional outbox and lease-based dispatcher queue. */
export class JobService extends Context.Service<
  JobService,
  {
    readonly enqueue: (input: {
      readonly workspaceId: WorkspaceId;
      readonly payload: JobPayload;
      readonly runAt: Date;
      readonly idempotencyKey: string;
      readonly maxAttempts?: number;
    }) => Effect.Effect<string>;
    readonly claimDue: (input: {
      readonly limit: number;
      readonly leaseSeconds: number;
    }) => Effect.Effect<readonly ClaimedJob[]>;
    readonly markDispatched: (id: string) => Effect.Effect<void>;
    readonly complete: (id: string) => Effect.Effect<void>;
    readonly retry: (id: string, message: string) => Effect.Effect<void>;
    readonly cancel: (idempotencyKey: string) => Effect.Effect<void>;
    readonly defer: (
      id: string,
      runAt: Date,
      message: string
    ) => Effect.Effect<void>;
  }
>()("@delulu/services/JobService") {
  static readonly layer = Layer.effect(
    JobService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const enqueue = Effect.fn("JobService.enqueue")(function* (input: {
        readonly workspaceId: WorkspaceId;
        readonly payload: JobPayload;
        readonly runAt: Date;
        readonly idempotencyKey: string;
        readonly maxAttempts?: number;
      }) {
        const id = makeId(JobId);
        const rows = yield* sql<{ id: string }>`
          INSERT INTO jobs (id, workspace_id, payload, run_at, status, attempts, max_attempts, idempotency_key)
          VALUES (${id}, ${input.workspaceId}, ${JSON.stringify(input.payload)}::jsonb,
                  ${input.runAt}, 'pending', 0, ${input.maxAttempts ?? 5}, ${input.idempotencyKey})
          ON CONFLICT (idempotency_key) DO UPDATE SET run_at = EXCLUDED.run_at,
            payload = EXCLUDED.payload, status = 'pending', attempts = 0,
            locked_until = NULL, last_error = NULL
          RETURNING id`.pipe(Effect.orDie);
        return rows[0]?.id ?? id;
      });

      const claimQuery = SqlSchema.findAll({
        Request: Schema.Struct({
          limit: Schema.Number,
          leaseSeconds: Schema.Number,
        }),
        Result: ClaimedJobRow,
        execute: ({ limit, leaseSeconds }) => sql`
          WITH due AS (
            SELECT id FROM jobs
            WHERE (status = 'pending' OR (status = 'leased' AND locked_until < now()))
              AND run_at <= now() AND attempts < max_attempts
            ORDER BY run_at, created_at
            FOR UPDATE SKIP LOCKED
            LIMIT ${limit}
          )
          UPDATE jobs j SET status = 'leased', attempts = attempts + 1,
            locked_until = now() + (${leaseSeconds} * interval '1 second')
          FROM due WHERE j.id = due.id
          RETURNING j.id, j.workspace_id, j.payload, j.attempts, j.max_attempts`,
      });
      const decodePayload = Schema.decodeUnknownSync(JobPayload);
      const claimDue = (input: {
        readonly limit: number;
        readonly leaseSeconds: number;
      }) =>
        sql.withTransaction(claimQuery(input)).pipe(
          Effect.map((rows) =>
            rows.map((row) => ({ ...row, payload: decodePayload(row.payload) }))
          ),
          Effect.orDie
        );
      const markDispatched = (id: string) =>
        sql`UPDATE jobs SET status = 'dispatched', locked_until = NULL WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.orDie
        );
      const complete = (id: string) =>
        sql`UPDATE jobs SET status = 'completed', locked_until = NULL, last_error = NULL WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.orDie
        );
      const retry = (id: string, message: string) =>
        sql`UPDATE jobs SET
              status = CASE WHEN attempts >= max_attempts THEN 'failed'::job_status ELSE 'pending'::job_status END,
              run_at = now() + (LEAST(300, power(2, attempts)::integer) * interval '1 second'),
              locked_until = NULL, last_error = ${message}
            WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie);
      const cancel = (idempotencyKey: string) =>
        sql`DELETE FROM jobs WHERE idempotency_key = ${idempotencyKey}
          AND status IN ('pending', 'leased', 'dispatched', 'failed')`.pipe(
          Effect.asVoid,
          Effect.orDie
        );
      const defer = (id: string, runAt: Date, message: string) =>
        sql`UPDATE jobs SET status = 'pending', run_at = ${runAt}, attempts = 0,
          locked_until = NULL, last_error = ${message} WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.orDie
        );
      return JobService.of({
        enqueue,
        claimDue,
        markDispatched,
        complete,
        retry,
        cancel,
        defer,
      });
    })
  );
}
