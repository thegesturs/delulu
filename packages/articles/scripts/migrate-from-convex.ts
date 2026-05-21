/**
 * One-time migration: read all articles from Convex and write them to
 * Cloudflare R2 + KV via the REST API.
 *
 * Run from the repo root:
 *   CF_ACCOUNT_ID=... \
 *   CF_API_TOKEN=... \
 *   CF_ARTICLES_KV_NAMESPACE_ID=... \
 *   CF_ARTICLES_R2_BUCKET=delulu-articles \
 *   CONVEX_URL=https://your-deployment.convex.cloud \
 *   pnpm tsx packages/articles/scripts/migrate-from-convex.ts
 *
 * The CF API token needs:
 *   - Workers KV Storage: Edit
 *   - Workers R2 Storage: Edit
 *
 * Idempotent — safe to re-run. Run this once *before* flipping the Outrank
 * webhook URL to apps/web so the new endpoint has a fresh index to merge into.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../database/convex/_generated/api.js";
import { articleObjectKey, metaKey, PREVIEWS_INDEX_KEY } from "../src/keys.js";
import type { ArticlePreview, ArticleRecord } from "../src/types.js";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

async function kvPut(
  accountId: string,
  namespaceId: string,
  token: string,
  key: string,
  value: string
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: value,
  });
  if (!res.ok) {
    throw new Error(`KV PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}

async function r2Put(
  accountId: string,
  bucket: string,
  token: string,
  key: string,
  body: string
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const accountId = required("CF_ACCOUNT_ID");
  const token = required("CF_API_TOKEN");
  const kvNamespaceId = required("CF_ARTICLES_KV_NAMESPACE_ID");
  const r2Bucket = required("CF_ARTICLES_R2_BUCKET");
  const convexUrl = required("CONVEX_URL");

  const client = new ConvexHttpClient(convexUrl);

  console.log(`Reading articles from ${convexUrl}...`);
  // biome-ignore lint/suspicious/noExplicitAny: getAllArticles is deprecated and untyped from outside
  const articles: any[] = await client.query(api.articles.getAllArticles, {});
  console.log(`Found ${articles.length} articles. Writing to R2 + KV...`);

  const previews: ArticlePreview[] = [];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const record: ArticleRecord = {
      outrankId: a.outrankId,
      title: a.title,
      slug: a.slug,
      contentMarkdown: a.contentMarkdown,
      contentHtml: a.contentHtml,
      metaDescription: a.metaDescription,
      imageUrl: a.imageUrl,
      tags: a.tags ?? [],
      outrankCreatedAt: a.outrankCreatedAt,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };

    const preview: ArticlePreview = {
      slug: record.slug,
      title: record.title,
      metaDescription: record.metaDescription,
      imageUrl: record.imageUrl,
      tags: record.tags,
      publishedAt: record.publishedAt,
    };
    previews.push(preview);

    await r2Put(
      accountId,
      r2Bucket,
      token,
      articleObjectKey(record.slug),
      JSON.stringify(record)
    );
    await kvPut(
      accountId,
      kvNamespaceId,
      token,
      metaKey(record.slug),
      JSON.stringify(preview)
    );
    console.log(`  [${i + 1}/${articles.length}] ${record.slug}`);
  }

  previews.sort((a, b) => b.publishedAt - a.publishedAt);
  await kvPut(
    accountId,
    kvNamespaceId,
    token,
    PREVIEWS_INDEX_KEY,
    JSON.stringify(previews)
  );

  console.log(`Done. Wrote ${previews.length} articles + index.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
