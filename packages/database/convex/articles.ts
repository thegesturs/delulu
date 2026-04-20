import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/**
 * Upsert articles received from Outrank webhook.
 * Uses outrankId for deduplication — updates existing articles or creates new ones.
 */
export const upsertArticles = internalMutation({
  args: {
    articles: v.array(
      v.object({
        outrankId: v.string(),
        title: v.string(),
        slug: v.string(),
        contentMarkdown: v.string(),
        contentHtml: v.string(),
        metaDescription: v.string(),
        imageUrl: v.optional(v.string()),
        tags: v.array(v.string()),
        outrankCreatedAt: v.number(),
        publishedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const article of args.articles) {
      const existing = await ctx.db
        .query("articles")
        .withIndex("by_outrank_id", (q) => q.eq("outrankId", article.outrankId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...article,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("articles", {
          ...article,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

/**
 * Preview (no article body) — for list views. Omits contentMarkdown/contentHtml
 * to keep payload under a few KB so /blogs and the home preview don't cost
 * hundreds of MB of Convex bandwidth.
 */
const articlePreviewValidator = v.object({
  _id: v.id("articles"),
  slug: v.string(),
  title: v.string(),
  metaDescription: v.string(),
  imageUrl: v.optional(v.string()),
  tags: v.array(v.string()),
  publishedAt: v.number(),
});

interface ArticlePreview {
  _id: import("./_generated/dataModel").Id<"articles">;
  slug: string;
  title: string;
  metaDescription: string;
  imageUrl: string | undefined;
  tags: string[];
  publishedAt: number;
}

function toPreview(
  a: import("./_generated/dataModel").Doc<"articles">
): ArticlePreview {
  return {
    _id: a._id,
    slug: a.slug,
    title: a.title,
    metaDescription: a.metaDescription,
    imageUrl: a.imageUrl,
    tags: a.tags,
    publishedAt: a.publishedAt,
  };
}

/**
 * List articles (previews only). Used by /blogs and the home blog section.
 * Next.js pages that call this should be ISR-cached (revalidate).
 */
export const getArticlesPreviewList = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(articlePreviewValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published_at")
      .order("desc")
      .take(limit);
    return articles.map(toPreview);
  },
});

/**
 * Article metadata only — for Next.js generateMetadata. No article body.
 */
export const getArticleMetadataBySlug = query({
  args: { slug: v.string() },
  returns: v.union(articlePreviewValidator, v.null()),
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return article ? toPreview(article) : null;
  },
});

/**
 * All slugs for generateStaticParams. Tiny payload.
 */
export const getArticleSlugs = query({
  args: {},
  returns: v.array(v.object({ slug: v.string() })),
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published_at")
      .order("desc")
      .take(500);
    return articles.map((a) => ({ slug: a.slug }));
  },
});

/**
 * Full article (with contentMarkdown/contentHtml). Only used on the article
 * page itself, which is ISR-cached in Next.js.
 */
export const getArticleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * @deprecated Use getArticlesPreviewList. Kept for any stray callers.
 */
export const getAllArticles = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published_at")
      .order("desc")
      .collect();
    return articles;
  },
});

/**
 * @deprecated Use getArticlesPreviewList with a limit arg.
 */
export const getRecentArticles = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published_at")
      .order("desc")
      .take(limit);
    return articles;
  },
});
