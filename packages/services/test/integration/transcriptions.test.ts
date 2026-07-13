import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import { IdentityService } from "../../src/identity";
import { TranscriptionService } from "../../src/transcriptions";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});
const AppLayer = Layer.mergeAll(
  IdentityService.layer,
  TranscriptionService.layer
).pipe(Layer.provideMerge(Pg));

describe("TranscriptionService", () => {
  it("creates, caches, lists, and increments pooled usage", async () => {
    const externalUserId = `clerk_${crypto.randomUUID()}`;
    const reelId = `reel_${crypto.randomUUID()}`;
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const identity = yield* IdentityService;
        const transcriptions = yield* TranscriptionService;
        const resolved = yield* identity.resolve({ sub: externalUserId });

        const claimed = yield* transcriptions.createAndIncrement({
          externalUserId,
          reelId,
          reelUrl: `https://www.instagram.com/reel/${reelId}`,
          text: "A test transcription",
          altText: "A romanized test transcription",
          language: "hindi",
          durationSeconds: 12.5,
        });
        const created = claimed.record;
        if (!created) {
          return yield* Effect.die("unexpected transcription quota rejection");
        }
        const cached = yield* transcriptions.getByReelId({
          externalUserId,
          reelId,
        });
        const usage = yield* transcriptions.usageByUserId(resolved.user.id);
        const page = yield* transcriptions.list({
          userId: resolved.user.id,
          limit: 10,
        });
        return { created, cached, usage, page };
      }).pipe(Effect.provide(AppLayer))
    );

    expect(result.cached?.isOwnCache).toBe(true);
    expect(result.cached?.text).toBe(result.created.text);
    expect(result.page.page.map((item) => item.id)).toContain(
      result.created.id
    );
    expect(result.usage.used).toBe(1);
  });
});
