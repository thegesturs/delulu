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
 * Get all articles sorted by publishedAt descending.
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
 * Get a single article by slug.
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
 * Get N most recent articles (for landing page blog section).
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
