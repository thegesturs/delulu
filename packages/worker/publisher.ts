import { normalizePostgresUrl } from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { processPostgresMessage } from "./postgres-client";

const Pg = PgClient.layer({
  url: Redacted.make(
    normalizePostgresUrl(
      process.env.DATABASE_URL ??
        "postgres://delulu:delulu@localhost:5432/delulu"
    )
  ),
  maxConnections: 5,
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

export interface PublisherOptions {
  readonly signal: AbortSignal;
  readonly concurrency?: number;
  readonly pollIntervalMs?: number;
}

export const claimPublishJobs = (limit: number) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return yield* sql<{ id: string; targetId: string }>`WITH candidates AS (
      SELECT id FROM jobs
      WHERE payload->>'_tag' = 'PublishTarget'
        AND run_at <= now()
        AND attempts < max_attempts
        AND (status = 'pending' OR (status = 'leased' AND locked_until < now()))
      ORDER BY run_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE jobs j SET status = 'leased', attempts = attempts + 1,
      locked_until = now() + interval '2 minutes'
    FROM candidates c WHERE j.id = c.id
    RETURNING j.id, j.payload->>'targetId' AS target_id`;
  });

const recordPublishFailure = (jobId: string, error: unknown) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const message = error instanceof Error ? error.message : String(error);
    yield* sql`UPDATE jobs SET
      status = CASE WHEN attempts >= max_attempts THEN 'failed'::job_status ELSE 'pending'::job_status END,
      run_at = CASE WHEN attempts >= max_attempts THEN run_at ELSE now() + interval '30 seconds' END,
      locked_until = NULL,
      last_error = ${message}
      WHERE id = ${jobId} AND status <> 'completed'`;
  });

export const waitForPoll = (
  signal: AbortSignal,
  delayMs: number
): Promise<void> =>
  new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timeout = setTimeout(finish, delayMs);
    signal.addEventListener("abort", finish, { once: true });
  });

export const runPublisher = async ({
  signal,
  concurrency = 5,
  pollIntervalMs = 1000,
}: PublisherOptions): Promise<void> => {
  while (!signal.aborted) {
    const claimed = await Effect.runPromise(
      claimPublishJobs(concurrency).pipe(Effect.provide(Pg))
    );
    if (claimed.length === 0) {
      await waitForPoll(signal, pollIntervalMs);
      continue;
    }
    await Promise.all(
      claimed.map(async (job) => {
        try {
          await processPostgresMessage(
            JSON.stringify({ jobId: job.id, targetId: job.targetId })
          );
        } catch (error) {
          await Effect.runPromise(
            recordPublishFailure(job.id, error).pipe(Effect.provide(Pg))
          );
        }
      })
    );
  }
};
