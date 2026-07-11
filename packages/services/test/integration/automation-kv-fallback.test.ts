import { AutomationId, makeId } from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import {
  AutomationKvNamespace,
  AutomationKvService,
} from "../../src/automation-kv";
import { AutomationService } from "../../src/automations";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const serviceLayer = (namespace: Layer.Layer<AutomationKvNamespace>) => {
  const Kv = AutomationKvService.layer.pipe(Layer.provide(namespace));
  return AutomationService.layer.pipe(
    Layer.provide(Kv),
    Layer.provideMerge(Pg)
  );
};

describe("automation KV fallback", () => {
  it("falls back to Postgres on a KV outage", async () => {
    const namespace = Layer.succeed(
      AutomationKvNamespace,
      AutomationKvNamespace.of({
        get: async () => Promise.reject(new Error("KV unavailable")),
        put: async () => Promise.reject(new Error("KV unavailable")),
        delete: async () => Promise.reject(new Error("KV unavailable")),
      })
    );
    const program = Effect.gen(function* () {
      const automations = yield* AutomationService;
      return yield* automations.findForTrigger(
        `profile_${crypto.randomUUID()}`,
        `media_${crypto.randomUUID()}`
      );
    });
    await expect(
      Effect.runPromise(program.pipe(Effect.provide(serviceLayer(namespace))))
    ).resolves.toEqual([]);
  });

  it("filters stale KV automation ids against authoritative rows", async () => {
    const staleId = makeId(AutomationId);
    const namespace = AutomationKvService.memoryLayer({
      "automation:trigger:profile_stale:media_stale": JSON.stringify({
        automationIds: [staleId],
      }),
    });
    const program = Effect.gen(function* () {
      const automations = yield* AutomationService;
      return yield* automations.findForTrigger("profile_stale", "media_stale");
    });
    await expect(
      Effect.runPromise(program.pipe(Effect.provide(serviceLayer(namespace))))
    ).resolves.toEqual([]);
  });
});
