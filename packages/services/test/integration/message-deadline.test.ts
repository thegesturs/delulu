import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { expect, it } from "vitest";
import { JobService } from "../../src/jobs";
import { LifecycleService } from "../../src/lifecycle";
import {
  LifecycleProvider,
  MessagingService,
  TransactionalEmailProvider,
} from "../../src/messaging";
import { provisionPaidSubscription } from "./paid-subscription";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: false,
});
it("propagates delivery failure to the alarm and completes a later retry", async () => {
  let attempts = 0;
  let messageId = "";
  const Jobs = Layer.succeed(
    JobService,
    JobService.of({
      enqueue: (input) =>
        Effect.sync(() => {
          if (input.payload._tag === "DeliverMessage") {
            messageId = input.payload.messageId;
          }
          return "job";
        }),
      cancel: () => Effect.void,
    })
  );
  const Messaging = MessagingService.layer.pipe(
    Layer.provide([
      Pg,
      Jobs,
      Layer.succeed(
        LifecycleProvider,
        LifecycleProvider.of({
          name: "noop",
          identify: () => Effect.void,
          track: () => Effect.void,
        })
      ),
      Layer.succeed(
        TransactionalEmailProvider,
        TransactionalEmailProvider.of({
          name: "noop",
          send: () =>
            ++attempts === 1
              ? Effect.fail("provider unavailable")
              : Effect.succeed({ messageId: "provider-message" }),
        })
      ),
    ])
  );
  await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const messages = yield* MessagingService;
      const user = `message-test:${crypto.randomUUID()}`;
      yield* sql`INSERT INTO users (id, external_id) VALUES (${user}, ${user})`;
      yield* messages.sendTransactional({
        userId: user,
        email: "test@example.test",
        subject: "test",
        html: "test",
        text: "test",
        messageType: "test",
        idempotencyKey: user,
      });
      expect(messageId).not.toBe("");
      const failed = yield* messages.deliver(messageId).pipe(Effect.exit);
      expect(failed._tag).toBe("Failure");
      yield* messages.deliver(messageId);
      yield* messages.deliver(messageId);
      const rows = yield* sql<{
        status: string;
        attempts: number;
      }>`SELECT status, attempts FROM message_deliveries WHERE id = ${messageId}`;
      expect(rows[0]).toEqual({ status: "sent", attempts: 2 });
      expect(attempts).toBe(2);
    }).pipe(Effect.provide(Layer.mergeAll(Pg, Messaging)))
  );
});

it("schedules lifecycle deadlines for an owner with no recorded activity", async () => {
  const Jobs = Layer.succeed(
    JobService,
    JobService.of({
      enqueue: () => Effect.succeed("job"),
      cancel: () => Effect.void,
    })
  );
  const Messaging = MessagingService.layer.pipe(
    Layer.provide([
      Jobs,
      Layer.succeed(
        LifecycleProvider,
        LifecycleProvider.of({
          name: "noop",
          identify: () => Effect.void,
          track: () => Effect.void,
        })
      ),
      Layer.succeed(
        TransactionalEmailProvider,
        TransactionalEmailProvider.of({
          name: "noop",
          send: () => Effect.succeed({}),
        })
      ),
    ])
  );
  const Lifecycle = LifecycleService.layer.pipe(
    Layer.provide([Jobs, Messaging])
  );
  await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const lifecycle = yield* LifecycleService;
      const id = `lifecycle-test:${crypto.randomUUID()}`;
      yield* sql`INSERT INTO users (id, external_id) VALUES (${id}, ${id})`;
      yield* provisionPaidSubscription(id);
      const deadline = yield* lifecycle.runScheduled(id);
      expect(deadline).toBeGreaterThan(Date.now());
      expect(deadline).toBeLessThanOrEqual(Date.now() + 7 * 86_400_000);
    }).pipe(Effect.provide(Lifecycle), Effect.provide(Pg))
  );
});
