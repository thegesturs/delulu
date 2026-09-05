import { type JobIntent, JobService, JobTransport } from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { expect, it } from "vitest";
import { makeJobRuntime } from "../src/job-runtime";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: false,
});
it("distinguishes commit, in-flight prepare, and a rolled-back savepoint", async () => {
  const captured: JobIntent[] = [];
  const runtime = makeJobRuntime(
    () => Pg,
    async () => null,
    async () => undefined
  );
  const transport = Layer.succeed(
    JobTransport,
    JobTransport.of({
      prepare: async (intent) => {
        captured.push(intent);
        expect(await runtime.receipt(intent)).toBe("pending");
      },
    })
  );
  const Jobs = JobService.layer.pipe(Layer.provide([Pg, transport]));
  await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const jobs = yield* JobService;
      yield* sql.withTransaction(
        Effect.gen(function* () {
          yield* jobs.enqueue({
            workspaceId: "test",
            payload: { _tag: "DeliverMessage", messageId: "committed" },
            runAt: new Date(),
            idempotencyKey: crypto.randomUUID(),
          });
          const rollback = yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* jobs.enqueue({
                  workspaceId: "test",
                  payload: { _tag: "DeliverMessage", messageId: "rolled-back" },
                  runAt: new Date(),
                  idempotencyKey: crypto.randomUUID(),
                });
                return yield* Effect.fail("rollback savepoint");
              })
            )
            .pipe(Effect.result);
          expect(rollback._tag).toBe("Failure");
        })
      );
    }).pipe(Effect.provide(Layer.mergeAll(Pg, Jobs)))
  );
  expect(await runtime.receipt(captured[0])).toBe("committed");
  expect(await runtime.receipt(captured[1])).toBe("aborted");
  await runtime.removeReceipt(captured[0].receiptId);
});
