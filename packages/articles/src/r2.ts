import type { R2Bucket } from "@cloudflare/workers-types";
import { articleObjectKey } from "./keys";
import type { ArticleRecord } from "./types";

export async function getArticle(
  bucket: R2Bucket,
  slug: string
): Promise<ArticleRecord | null> {
  const obj = await bucket.get(articleObjectKey(slug));
  if (!obj) {
    return null;
  }
  const text = await obj.text();
  return JSON.parse(text) as ArticleRecord;
}

export async function putArticle(
  bucket: R2Bucket,
  article: ArticleRecord
): Promise<void> {
  await bucket.put(articleObjectKey(article.slug), JSON.stringify(article), {
    httpMetadata: { contentType: "application/json" },
  });
}

export async function deleteArticle(
  bucket: R2Bucket,
  slug: string
): Promise<void> {
  await bucket.delete(articleObjectKey(slug));
}
