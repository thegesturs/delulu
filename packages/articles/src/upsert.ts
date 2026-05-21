import type { KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { getPreviews, putMeta, putPreviews } from "./kv";
import { putArticle } from "./r2";
import { type ArticleRecord, toPreview } from "./types";

export interface UpsertInput {
  outrankId: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  contentHtml: string;
  metaDescription: string;
  imageUrl?: string;
  tags: string[];
  outrankCreatedAt: number;
  publishedAt: number;
}

/**
 * Write articles to R2 and refresh the KV previews index + per-slug meta keys.
 * R2 stores the full article; KV stores the lightweight index and metadata used
 * for list / generateMetadata reads.
 */
export async function upsertArticles(
  bucket: R2Bucket,
  kv: KVNamespace,
  inputs: UpsertInput[]
): Promise<{ written: number }> {
  if (inputs.length === 0) {
    return { written: 0 };
  }
  const now = Date.now();

  const records: ArticleRecord[] = inputs.map((input) => ({
    ...input,
    createdAt: now,
    updatedAt: now,
  }));

  await Promise.all([
    ...records.map((r) => putArticle(bucket, r)),
    ...records.map((r) => putMeta(kv, toPreview(r))),
  ]);

  const existing = await getPreviews(kv);
  const newSlugs = new Set(records.map((r) => r.slug));
  const merged = [
    ...existing.filter((p) => !newSlugs.has(p.slug)),
    ...records.map(toPreview),
  ];
  await putPreviews(kv, merged);

  return { written: records.length };
}
