import type { KVNamespace } from "@cloudflare/workers-types";
import { metaKey, PREVIEWS_INDEX_KEY } from "./keys";
import type { ArticleMeta, ArticlePreview } from "./types";

export async function getPreviews(kv: KVNamespace): Promise<ArticlePreview[]> {
  const raw = await kv.get(PREVIEWS_INDEX_KEY, "json");
  if (!raw) {
    return [];
  }
  return raw as ArticlePreview[];
}

export async function putPreviews(
  kv: KVNamespace,
  previews: ArticlePreview[]
): Promise<void> {
  const sorted = [...previews].sort((a, b) => b.publishedAt - a.publishedAt);
  await kv.put(PREVIEWS_INDEX_KEY, JSON.stringify(sorted));
}

export async function getMeta(
  kv: KVNamespace,
  slug: string
): Promise<ArticleMeta | null> {
  const raw = await kv.get(metaKey(slug), "json");
  if (!raw) {
    return null;
  }
  return raw as ArticleMeta;
}

export async function putMeta(
  kv: KVNamespace,
  meta: ArticleMeta
): Promise<void> {
  await kv.put(metaKey(meta.slug), JSON.stringify(meta));
}
