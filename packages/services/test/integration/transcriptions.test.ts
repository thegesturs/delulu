import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import { IdentityService } from "../../src/identity";
import { TranscriptionService } from "../../src/transcriptions";
import { provisionPaidSubscription } from "./paid-subscription";

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
  it("grants the free quota to a newly provisioned user", async () => {
    const externalUserId = `clerk_${crypto.randomUUID()}`;
    const reelId = `reel_${crypto.randomUUID()}`;
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const identity = yield* IdentityService;
        const transcriptions = yield* TranscriptionService;
        yield* identity.resolve({ sub: externalUserId });
        const initialUsage = yield* transcriptions.usage(externalUserId);
        const claimed = yield* transcriptions.createAndIncrement({
          externalUserId,
          reelId,
          reelUrl: `https://www.instagram.com/reel/${reelId}`,
          text: "A free transcription",
          language: "english",
          durationSeconds: 5,
        });
        return { initialUsage, claimed };
      }).pipe(Effect.provide(AppLayer))
    );

    expect(result.initialUsage.used).toBe(0);
    expect(result.initialUsage.limit).toBe(10);
    expect(result.initialUsage.isSubscribed).toBe(false);
    expect(result.claimed.record?.text).toBe("A free transcription");
    expect(result.claimed.usage.used).toBe(1);
  });

  it("creates, caches, lists, and increments pooled usage", async () => {
    const externalUserId = `clerk_${crypto.randomUUID()}`;
    const reelId = `reel_${crypto.randomUUID()}`;
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const identity = yield* IdentityService;
        const transcriptions = yield* TranscriptionService;
        const resolved = yield* identity.resolve({ sub: externalUserId });
        yield* provisionPaidSubscription(resolved.user.id);

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
