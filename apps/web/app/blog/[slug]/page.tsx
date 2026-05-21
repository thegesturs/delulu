import { createBlogPostingSchema, JsonLd } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { allBlogs } from "content-collections";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import { MdastToJsx } from "safe-mdx";
import { BlogLayout } from "@/components/blog/blog-layout";
import CTA from "@/components/home/cta";
import { components } from "@/components/home/mdx-components";
import { env } from "@/env";
import {
  fetchArticle,
  fetchArticleMeta,
  fetchArticlePreviews,
} from "@/lib/articles";

const parser = remark()
  .use(remarkMdx)
  .use(remarkGfm)
  .use(() => {
    return (tree, file) => {
      file.data.ast = tree;
    };
  });

const url = new URL(`${env.NEXT_PUBLIC_WEB_URL}`);

// ISR: pre-render at build, revalidate hourly.
export const revalidate = 3600;
// Any slug not in generateStaticParams is rendered on demand (then cached).
export const dynamicParams = true;

export async function generateStaticParams() {
  const previews = await fetchArticlePreviews();
  return previews.map((p) => ({ slug: p.slug }));
}

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug, locale } = await params;

  // Check Content Collections first
  const blog = allBlogs.find((blog) => blog.slug === slug);
  if (blog) {
    const canonicalUrl = new URL(`/blog/${slug}`, url).href;
    return createMetadata({
      title: blog.title,
      description: blog.description,
      image: blog.image,
      metadataBase: url,
      keywords: blog.keywords,
      authors: [{ name: blog.author, url: canonicalUrl }],
      openGraph: {
        type: "article",
        publishedTime: blog.date,
        authors: [blog.author],
        tags: blog.categories,
        siteName: "Delulu Blog",
        locale,
        url: canonicalUrl,
      },
      robots: { index: true, follow: true },
      category: blog.categories[0] ?? "Blog",
      applicationName: "Delulu Social",
      abstract: blog.description,
      creator: blog.author,
      twitter: {
        card: "summary_large_image",
        creator: blog.author,
        images: [
          { url: blog.image ?? "", alt: blog.title, width: 1200, height: 630 },
        ],
      },
      alternates: { canonical: canonicalUrl },
    });
  }

  // Fallback to Outrank article — metadata only from KV, no body.
  const article = await fetchArticleMeta(slug);
  if (!article) {
    return notFound();
  }

  const canonicalUrl = new URL(`/blog/${slug}`, url).href;
  return createMetadata({
    title: article.title,
    description: article.metaDescription,
    image: article.imageUrl,
    metadataBase: url,
    keywords: article.tags,
    openGraph: {
      type: "article",
      publishedTime: new Date(article.publishedAt).toISOString(),
      tags: article.tags,
      siteName: "Delulu Blog",
      locale,
      url: canonicalUrl,
    },
    robots: { index: true, follow: true },
    category: article.tags[0] ?? "Blog",
    applicationName: "Delulu Social",
    abstract: article.metaDescription,
    twitter: {
      card: "summary_large_image",
      images: article.imageUrl
        ? [
            {
              url: article.imageUrl,
              alt: article.title,
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
    alternates: { canonical: canonicalUrl },
  });
};

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Check Content Collections first
  const blog = allBlogs.find((b) => b.slug === slug);
  if (blog) {
    const blogWithType = { ...blog, type: "blog" as const };
    const pageUrl = new URL(`/blog/${slug}`, url).href;

    const blogPostSchema = createBlogPostingSchema({
      title: blog.title,
      description: blog.description,
      url: pageUrl,
      image: blog.image,
      datePublished: blog.date,
      dateModified: blog.date,
      authorName: blog.author,
      authorUrl: pageUrl,
    });

    const file = parser.processSync(blog.content);
    const mdast = file.data.ast;
    const visitor = new MdastToJsx({ code: blog.content, mdast, components });
    const content = visitor.run();

    return (
      <div>
        <JsonLd code={blogPostSchema} />
        <BlogLayout blog={blogWithType}>{content}</BlogLayout>
        <div className="py-20">
          <CTA />
        </div>
      </div>
    );
  }

  // Fallback to Outrank article — full body from R2.
  const article = await fetchArticle(slug);
  if (!article) {
    return notFound();
  }

  const pageUrl = new URL(`/blog/${slug}`, url).href;
  const publishedDate = new Date(article.publishedAt).toISOString();

  const blogPostSchema = createBlogPostingSchema({
    title: article.title,
    description: article.metaDescription,
    url: pageUrl,
    image: article.imageUrl,
    datePublished: publishedDate,
    dateModified: publishedDate,
    authorName: "Delulu Social",
    authorUrl: pageUrl,
  });

  const file = parser.processSync(article.contentMarkdown);
  const mdast = file.data.ast;
  const visitor = new MdastToJsx({
    code: article.contentMarkdown,
    mdast,
    components,
  });
  const content = visitor.run();

  const blogLike = {
    type: "blog" as const,
    title: article.title,
    date: publishedDate,
    image: article.imageUrl,
    categories: article.tags,
    author: "Delulu Social",
  };

  return (
    <div>
      <JsonLd code={blogPostSchema} />
      <BlogLayout blog={blogLike}>{content}</BlogLayout>
      <div className="py-20">
        <CTA />
      </div>
    </div>
  );
}
