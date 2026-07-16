import { getCloudflareCtx } from "@delulu/cloudflare-types";
import { type NewsRoute, newsToolSlug } from "./config";
import { type NewsItem, type NewsProvider, rssNewsProvider } from "./provider";

export const NEWS_FRESH_MS = 15 * 60 * 1000;
export const NEWS_STALE_MS = 6 * 60 * 60 * 1000;
const NEWS_TIMEOUT_MS = 5000;
const CACHE_PREFIX = "tools:news:v1:";
const inFlightRefreshes = new Map<string, Promise<CachedNews>>();

export interface CachedNews {
  items: NewsItem[];
  fetchedAt: string;
  provider: string;
}

export interface NewsResult extends CachedNews {
  state: "fresh" | "stale" | "error";
  message?: string;
}

interface NewsDependencies {
  kv?: NewsCache;
  provider?: NewsProvider;
  now?: () => number;
  defer?: (promise: Promise<unknown>) => void;
}

export interface NewsCache {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(
    key: string,
    value: string,
    options: { expirationTtl: number }
  ): Promise<void>;
}

const cacheKey = (route: NewsRoute): string =>
  `${CACHE_PREFIX}${newsToolSlug(route)}`;

async function readCache(
  kv: NewsDependencies["kv"],
  route: NewsRoute
): Promise<CachedNews | null> {
  if (!kv) {
    return null;
  }
  try {
    return await kv.get<CachedNews>(cacheKey(route), "json");
  } catch {
    return null;
  }
}

async function refresh(
  route: NewsRoute,
  dependencies: NewsDependencies
): Promise<CachedNews> {
  const provider = dependencies.provider ?? rssNewsProvider;
  const timeout = AbortSignal.timeout(NEWS_TIMEOUT_MS);
  const items = await provider.fetch(route, timeout);
  if (items.length === 0) {
    throw new Error("The news feed returned no headlines");
  }
  const value = {
    items,
    fetchedAt: new Date((dependencies.now ?? Date.now)()).toISOString(),
    provider: provider.id,
  };
  if (dependencies.kv) {
    try {
      await dependencies.kv.put(cacheKey(route), JSON.stringify(value), {
        expirationTtl: 24 * 60 * 60,
      });
    } catch {
      // A cache write failure must not hide a successfully fetched feed.
    }
  }
  return value;
}

function refreshOnce(
  route: NewsRoute,
  dependencies: NewsDependencies
): Promise<CachedNews> {
  const key = cacheKey(route);
  const existing = inFlightRefreshes.get(key);
  if (existing) {
    return existing;
  }
  const pending = refresh(route, dependencies).finally(() => {
    if (inFlightRefreshes.get(key) === pending) {
      inFlightRefreshes.delete(key);
    }
  });
  inFlightRefreshes.set(key, pending);
  return pending;
}

export async function getCachedNews(
  route: NewsRoute,
  dependencies: NewsDependencies = {}
): Promise<NewsResult> {
  const now = (dependencies.now ?? Date.now)();
  const cached = await readCache(dependencies.kv, route);
  const age = cached
    ? now - new Date(cached.fetchedAt).getTime()
    : Number.POSITIVE_INFINITY;
  if (cached && age <= NEWS_FRESH_MS) {
    return { ...cached, state: "fresh" };
  }
  if (cached && age <= NEWS_STALE_MS) {
    const update = refreshOnce(route, dependencies).catch(() => undefined);
    dependencies.defer?.(update);
    return {
      ...cached,
      state: "stale",
      message: "Showing recent cached headlines while we refresh the feed.",
    };
  }
  try {
    return { ...(await refreshOnce(route, dependencies)), state: "fresh" };
  } catch {
    if (cached) {
      return {
        ...cached,
        state: "stale",
        message: `The live feed is temporarily unavailable. Showing an older emergency cache from ${new Date(cached.fetchedAt).toLocaleString()}.`,
      };
    }
    return {
      items: [],
      fetchedAt: new Date(now).toISOString(),
      provider: "unavailable",
      state: "error",
      message:
        "Headlines are temporarily unavailable. Please try again shortly.",
    };
  }
}

export async function getNewsForRequest(route: NewsRoute): Promise<NewsResult> {
  try {
    const context = await getCloudflareCtx();
    return await getCachedNews(route, {
      kv: (context.env as unknown as { DELULU_ARTICLES_KV: NewsCache })
        .DELULU_ARTICLES_KV,
      defer: (promise) => context.ctx.waitUntil(promise),
    });
  } catch {
    // Local Next.js development has no Cloudflare context. The provider still
    // works, while production uses KV to avoid one upstream request per visit.
    return await getCachedNews(route);
  }
}

/** Read-only sitemap gate: never fetches upstream or creates cache entries. */
export async function hasUsableCachedNews(route: NewsRoute): Promise<boolean> {
  try {
    const context = await getCloudflareCtx();
    const cached = await readCache(
      (context.env as unknown as { DELULU_ARTICLES_KV: NewsCache })
        .DELULU_ARTICLES_KV,
      route
    );
    return Boolean(cached?.items.length);
  } catch {
    return false;
  }
}
