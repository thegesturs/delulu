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

const parser = remark()
  .use(remarkMdx)
  .use(remarkGfm)
  .use(() => {
    return (tree, file) => {
      file.data.ast = tree;
    };
  });

const url = new URL(`${env.NEXT_PUBLIC_WEB_URL}`);

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug, locale } = await params;
  const blog = allBlogs.find((blog) => blog.slug === slug);
  if (!blog) {
    return notFound();
  }

  const canonicalUrl = new URL(`/blog/${slug}`, url).href;

  return createMetadata({
    title: blog.title,
    description: blog.description,
    image: blog.image,
    metadataBase: url,
    keywords: blog.keywords,
    authors: [
      {
        name: blog.author,
        url: canonicalUrl,
      },
    ],
    openGraph: {
      type: "article",
      publishedTime: blog.date,
      authors: [blog.author],
      tags: blog.categories,
      siteName: "Delulu Blog",
      locale,
      url: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    category: blog.categories[0] ?? "Blog",
    applicationName: "Delulu Social",
    abstract: blog.description,
    creator: blog.author,
    twitter: {
      card: "summary_large_image",
      creator: blog.author,
      images: [
        {
          url: blog.image ?? "",
          alt: blog.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  });
};

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug, locale } = await params;
  const blog = allBlogs.find((b) => b.slug === slug);
  if (!blog) {
    return notFound();
  }

  const blogWithType = {
    ...blog,
    type: "blog" as const,
  };

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

  // Parse and render MDX safely
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
