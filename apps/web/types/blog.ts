import type { Doc } from "@delulu/database/convex/_generated/dataModel";
import type { Blog } from "content-collections";

export interface UnifiedBlog {
  title: string;
  slug: string;
  description: string;
  date: string;
  author: string;
  authorAvatar?: string;
  image?: string;
  categories: string[];
  content: string;
  source: "content-collections" | "outrank";
}

export function adaptContentCollectionsBlog(blog: Blog): UnifiedBlog {
  return {
    title: blog.title,
    slug: blog.slug,
    description: blog.description,
    date: blog.date,
    author: blog.author,
    authorAvatar: blog.authorAvatar,
    image: blog.image,
    categories: blog.categories,
    content: blog.content,
    source: "content-collections",
  };
}

export function adaptConvexArticle(article: Doc<"articles">): UnifiedBlog {
  return {
    title: article.title,
    slug: article.slug,
    description: article.metaDescription,
    date: new Date(article.publishedAt).toISOString(),
    author: "Delulu Social",
    image: article.imageUrl,
    categories: article.tags,
    content: article.contentMarkdown,
    source: "outrank",
  };
}
