import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { beforeAll, describe, expect, it } from "vitest";
import {
  LifecycleProvider,
  MessagingService,
  TransactionalEmailProvider,
} from "../../src/messaging";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

let AppLayer: Layer.Layer<MessagingService | PgClient.PgClient>;

beforeAll(() => {
  const Providers = Layer.mergeAll(
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
    )
  );
  const Messaging = MessagingService.layer.pipe(Layer.provide(Providers));
  AppLayer = Messaging.pipe(Layer.provideMerge(Pg));
});

const createUser = Effect.fn("test.createMessagingUser")(function* () {
  const sql = yield* SqlClient.SqlClient;
  const id = `messaging_${crypto.randomUUID()}`;
  yield* sql`INSERT INTO users (id, external_id, email)
    VALUES (${id}, ${`external_${id}`}, ${`${id}@example.test`})`;
  return id;
});

describe("MessagingService", () => {
  it("does not persist suppressed payloads and reports transactional work as queued", async () => {
    const program = Effect.gen(function* () {
      const messaging = yield* MessagingService;
      const sql = yield* SqlClient.SqlClient;
      const userId = yield* createUser();
      yield* sql`INSERT INTO email_preferences
        (user_id, product_lifecycle_enabled)
        VALUES (${userId}, false)`;

      yield* messaging.track({
        userId,
        email: `${userId}@example.test`,
        event: "weekly_usage_digest",
        idempotencyKey: `suppressed:${userId}`,
      });
      const queued = yield* messaging.sendTransactional({
        userId,
        email: `${userId}@example.test`,
        messageType: "receipt",
        subject: "Receipt",
        html: "<p>Receipt</p>",
        text: "Receipt",
        idempotencyKey: `transactional:${userId}`,
      });
      const rows = yield* sql<{
        idempotencyKey: string;
        status: string;
      }>`SELECT idempotency_key, status FROM message_deliveries
        WHERE user_id = ${userId} ORDER BY idempotency_key`;
      return { queued, rows };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );

    expect(result.queued).toEqual({ status: "queued" });
    expect(result.rows).toEqual([
      {
        idempotencyKey: expect.stringContaining("transactional:"),
        status: "queued",
      },
    ]);
  });

  it("removes suppressed rows and redacts terminal, expired, and old sent payloads", async () => {
    const program = Effect.gen(function* () {
      const messaging = yield* MessagingService;
      const sql = yield* SqlClient.SqlClient;
      const userId = yield* createUser();
      const insert = (input: {
        readonly key: string;
        readonly status: string;
        readonly age: string;
        readonly lockedUntil?: string;
        readonly sentAt?: string;
      }) => sql`INSERT INTO message_deliveries
        (id, user_id, idempotency_key, channel, message_type, provider, status,
          payload, locked_until, sent_at, created_at)
        VALUES (${`message_${crypto.randomUUID()}`}, ${userId}, ${input.key},
          'transactional', 'test', 'noop', ${input.status},
          ${JSON.stringify({ kind: "transactional", text: "private" })}::jsonb,
          ${input.lockedUntil ?? null}::timestamptz,
          ${input.sentAt ?? null}::timestamptz,
          now() - ${input.age}::interval)`;

      yield* insert({
        key: `suppressed:${userId}`,
        status: "suppressed",
        age: "1 minute",
      });
      yield* insert({ key: `dead:${userId}`, status: "dead", age: "1 minute" });
      yield* insert({
        key: `failed-old:${userId}`,
        status: "failed",
        age: "8 days",
      });
      yield* insert({
        key: `queued-old:${userId}`,
        status: "queued",
        age: "8 days",
      });
      yield* insert({
        key: `leased-active:${userId}`,
        status: "leased",
        age: "8 days",
        lockedUntil: new Date(Date.now() + 60_000).toISOString(),
      });
      yield* insert({
        key: `leased-expired:${userId}`,
        status: "leased",
        age: "8 days",
        lockedUntil: new Date(Date.now() - 60_000).toISOString(),
      });
      yield* insert({
        key: `sent-old:${userId}`,
        status: "sent",
        age: "31 days",
        sentAt: new Date(Date.now() - 31 * 86_400_000).toISOString(),
      });
      yield* insert({
        key: `sent-recent:${userId}`,
        status: "sent",
        age: "29 days",
        sentAt: new Date(Date.now() - 29 * 86_400_000).toISOString(),
      });

      const result = yield* messaging.runRetention();
      const rows = yield* sql<{
        idempotencyKey: string;
        status: string;
        payload: unknown;
      }>`SELECT idempotency_key, status, payload FROM message_deliveries
        WHERE user_id = ${userId} ORDER BY idempotency_key`;
      return { result, rows };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );

    expect(result.result.deleted).toBeGreaterThanOrEqual(1);
    expect(result.result.redacted).toBeGreaterThanOrEqual(5);
    expect(result.rows).toEqual([
      {
        idempotencyKey: expect.stringContaining("dead:"),
        status: "dead",
        payload: { kind: "redacted" },
      },
      {
        idempotencyKey: expect.stringContaining("failed-old:"),
        status: "dead",
        payload: { kind: "redacted" },
      },
      {
        idempotencyKey: expect.stringContaining("leased-active:"),
        status: "leased",
        payload: { kind: "transactional", text: "private" },
      },
      {
        idempotencyKey: expect.stringContaining("leased-expired:"),
        status: "dead",
        payload: { kind: "redacted" },
      },
      {
        idempotencyKey: expect.stringContaining("queued-old:"),
        status: "dead",
        payload: { kind: "redacted" },
      },
      {
        idempotencyKey: expect.stringContaining("sent-old:"),
        status: "sent",
        payload: { kind: "redacted" },
      },
      {
        idempotencyKey: expect.stringContaining("sent-recent:"),
        status: "sent",
        payload: { kind: "transactional", text: "private" },
      },
    ]);
  });
});
