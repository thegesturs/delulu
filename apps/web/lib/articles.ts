import {
  type ArticleMeta,
  type ArticlePreview,
  type ArticleRecord,
  getArticle,
  getMeta,
  getPreviews,
} from "@delulu/articles";
import { getCloudflareEnv } from "@delulu/cloudflare-types";

export async function fetchArticlePreviews(
  limit?: number
): Promise<ArticlePreview[]> {
  const env = await getCloudflareEnv();
  const previews = await getPreviews(env.DELULU_ARTICLES_KV);
  return typeof limit === "number" ? previews.slice(0, limit) : previews;
}

export async function fetchArticleMeta(
  slug: string
): Promise<ArticleMeta | null> {
  const env = await getCloudflareEnv();
  return await getMeta(env.DELULU_ARTICLES_KV, slug);
}

export async function fetchArticle(
  slug: string
): Promise<ArticleRecord | null> {
  const env = await getCloudflareEnv();
  return await getArticle(env.DELULU_ARTICLES_BUCKET, slug);
}
