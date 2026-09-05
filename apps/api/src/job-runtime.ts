import {
  type DurableJob,
  type JobIntent,
  JobTransport,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import type { JobRuntime } from "./durable-job";
import type { Env } from "./env";

export interface JobNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}
export const sendIntent = async (
  namespace: JobNamespace,
  intent: JobIntent
) => {
  const response = await namespace.get(namespace.idFromName(intent.key)).fetch(
    new Request("https://jobs/prepare", {
      method: "POST",
      body: JSON.stringify(intent),
    })
  );
  if (!response.ok) {
    throw new Error(`Durable job prepare failed: ${response.status}`);
  }
};
export const jobTransportLayer = (env: Env) =>
  Layer.succeed(
    JobTransport,
    JobTransport.of({
      prepare: async (intent) => {
        if (env.JOBS) {
          return sendIntent(env.JOBS, intent);
        }
        if (!(env.SCHEDULER_URL && env.SCHEDULER_SECRET)) {
          throw new Error("Durable job service is not configured");
        }
        const url = new URL("/internal/jobs", env.SCHEDULER_URL);
        if (url.protocol !== "https:") {
          throw new Error("Remote scheduler requires HTTPS");
        }
        const response = await fetch(url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.SCHEDULER_SECRET}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(intent),
        });
        if (!response.ok) {
          throw new Error(`Remote scheduler returned ${response.status}`);
        }
      },
    })
  );

export const makeJobRuntime = <E>(
  pg: () => Layer.Layer<SqlClient.SqlClient, E>,
  execute: (job: DurableJob) => Promise<number | null>,
  failed: (job: DurableJob, error: string) => Promise<void>
): JobRuntime => ({
  receipt: (intent) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      // CURRENT_TIMESTAMP prevents Hyperdrive caching a pre-commit absence.
      const states = yield* sql<{ state: string | null }>`SELECT
      pg_xact_status(${intent.transactionId}::xid8) AS state
      WHERE CURRENT_TIMESTAMP IS NOT NULL`;
      if (states[0].state === "in progress") {
        return "pending" as const;
      }
      if (states[0].state === "aborted") {
        return "aborted" as const;
      }
      if (states[0].state === "committed") {
        // A fresh statement observes the committed transaction, including whether
        // its receipt survived any rolled-back savepoint.
        const rows = yield* sql<{ exists: boolean }>`SELECT
        EXISTS(SELECT 1 FROM execution_receipts WHERE id = ${intent.receiptId}::uuid) AS exists
        WHERE CURRENT_TIMESTAMP IS NOT NULL`;
        return rows[0].exists ? ("committed" as const) : ("aborted" as const);
      }
      throw new Error(
        "Transaction outcome unavailable; refusing unverified execution"
      );
    }).pipe(Effect.provide(pg()), Effect.runPromise),
  removeReceipt: (id) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql`DELETE FROM execution_receipts WHERE id = ${id}::uuid`;
    }).pipe(Effect.provide(pg()), Effect.runPromise),
  execute,
  failed,
});
