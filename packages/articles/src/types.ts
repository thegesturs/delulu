export interface ArticleRecord {
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
  createdAt: number;
  updatedAt: number;
}

export interface ArticlePreview {
  slug: string;
  title: string;
  metaDescription: string;
  imageUrl?: string;
  tags: string[];
  publishedAt: number;
}

export interface ArticleMeta {
  slug: string;
  title: string;
  metaDescription: string;
  imageUrl?: string;
  tags: string[];
  publishedAt: number;
}

export function toPreview(article: ArticleRecord): ArticlePreview {
  return {
    slug: article.slug,
    title: article.title,
    metaDescription: article.metaDescription,
    imageUrl: article.imageUrl,
    tags: article.tags,
    publishedAt: article.publishedAt,
  };
}
