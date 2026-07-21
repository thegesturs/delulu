import {
  type ArticleMeta,
  type ArticlePreview,
  type ArticleRecord,
  getArticle,
  getMeta,
  getPreviews,
} from "@delulu/articles";
import { getCloudflareEnv } from "@delulu/cloudflare-types";

const NON_PRODUCTION_ARTICLE_SLUGS = new Set([
  "sample-article-title-for-testing",
]);

export async function fetchArticlePreviews(
  limit?: number
): Promise<ArticlePreview[]> {
  const env = await getCloudflareEnv();
  const previews = await getPreviews(env.DELULU_ARTICLES_KV);
  const publishablePreviews = previews.filter(
    (preview) => !NON_PRODUCTION_ARTICLE_SLUGS.has(preview.slug)
  );

  return typeof limit === "number"
    ? publishablePreviews.slice(0, limit)
    : publishablePreviews;
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
