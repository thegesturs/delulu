import { v } from "convex/values";

// ============================================================================
// ARTICLE SCHEMAS (Outrank webhook articles)
// ============================================================================

export const baseArticleSchema = v.object({
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
  createdAt: v.number(),
  updatedAt: v.number(),
});
