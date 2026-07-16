import { describe, expect, it, vi } from "vitest";
import type { NewsProvider } from "./provider";
import { getCachedNews, NEWS_FRESH_MS, type NewsCache } from "./service";

const NOW = Date.parse("2026-07-16T12:00:00.000Z");
const item = {
  id: "story",
  headline: "A current headline",
  source: "Example Publisher",
  publishedAt: "2026-07-16T11:00:00.000Z",
  url: "https://publisher.example/story",
};

const provider = (
  fetchImplementation: NewsProvider["fetch"]
): NewsProvider => ({
  id: "test-provider",
  fetch: fetchImplementation,
});

describe("cached news service", () => {
  it("returns a fresh cache without calling upstream", async () => {
    const fetch = vi.fn(async () => [item]);
    const kv = {
      get: vi.fn(async () => ({
        items: [item],
        fetchedAt: new Date(NOW).toISOString(),
        provider: "cached",
      })),
      put: vi.fn(async () => undefined),
    } as unknown as NewsCache;
    const result = await getCachedNews(
      {},
      { kv, provider: provider(fetch), now: () => NOW }
    );
    expect(result.state).toBe("fresh");
    expect(result.provider).toBe("cached");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("serves stale content immediately and defers refresh", async () => {
    const fetch = vi.fn(async () => [item]);
    const deferred: Promise<unknown>[] = [];
    const kv = {
      get: vi.fn(async () => ({
        items: [item],
        fetchedAt: new Date(NOW - NEWS_FRESH_MS - 1).toISOString(),
        provider: "cached",
      })),
      put: vi.fn(async () => undefined),
    } as unknown as NewsCache;
    const result = await getCachedNews(
      {},
      {
        kv,
        provider: provider(fetch),
        now: () => NOW,
        defer: (promise) => deferred.push(promise),
      }
    );
    expect(result.state).toBe("stale");
    expect(result.items).toEqual([item]);
    expect(deferred).toHaveLength(1);
    await Promise.all(deferred);
    expect(fetch).toHaveBeenCalledOnce();
    expect(kv.put).toHaveBeenCalledOnce();
  });

  it("returns a graceful error when no cache or feed is available", async () => {
    const result = await getCachedNews(
      {},
      {
        provider: provider(async () => {
          throw new Error("offline");
        }),
        now: () => NOW,
      }
    );
    expect(result).toMatchObject({
      state: "error",
      items: [],
      provider: "unavailable",
    });
  });

  it("returns fresh headlines when the cache write fails", async () => {
    const kv = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => {
        throw new Error("KV unavailable");
      }),
    } as unknown as NewsCache;
    const result = await getCachedNews(
      {},
      {
        kv,
        provider: provider(async () => [item]),
        now: () => NOW,
      }
    );
    expect(result).toMatchObject({ state: "fresh", items: [item] });
  });

  it("coalesces concurrent cold-cache refreshes", async () => {
    let releaseFetch: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseFetch = resolve;
    });
    const fetch = vi.fn(async () => {
      await gate;
      return [item];
    });
    const dependencies = {
      provider: provider(fetch),
      now: () => NOW,
    };
    const first = getCachedNews(
      {
        category: {
          slug: "health",
          name: "Health",
          providerTopic: "HEALTH",
          context: "health",
        },
      },
      dependencies
    );
    const second = getCachedNews(
      {
        category: {
          slug: "health",
          name: "Health",
          providerTopic: "HEALTH",
          context: "health",
        },
      },
      dependencies
    );
    await Promise.resolve();
    releaseFetch?.();
    const results = await Promise.all([first, second]);
    expect(fetch).toHaveBeenCalledOnce();
    expect(results.every((result) => result.state === "fresh")).toBe(true);
  });
});
