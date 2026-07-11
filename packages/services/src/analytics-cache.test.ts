import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  AnalyticsCache,
  makeMemoryAnalyticsCacheLayer,
  operationalStatsCacheKey,
} from "./analytics-cache";

describe("AnalyticsCache", () => {
  it("keys operational responses by workspace stats version", () => {
    expect(operationalStatsCacheKey("workspace_one", 7)).toBe(
      "analytics:operational:workspace_one:v7"
    );
  });

  it("round-trips values through an injectable adapter", async () => {
    const program = Effect.gen(function* () {
      const cache = yield* AnalyticsCache;
      yield* cache.put("key", "value", 30);
      return yield* cache.get("key");
    });
    await expect(
      Effect.runPromise(
        program.pipe(Effect.provide(makeMemoryAnalyticsCacheLayer()))
      )
    ).resolves.toBe("value");
  });
});
