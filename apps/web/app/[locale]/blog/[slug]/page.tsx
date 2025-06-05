import { BlogLayout } from '@/components/blog/blog-layout';
import CTA from '@/components/cta';
import { components } from '@/components/mdx-components';
import { env } from '@/env';
import { MDXContent } from '@content-collections/mdx/react';
import type { Article, WithContext } from '@delulu/seo/json-ld';
import { JsonLd } from '@delulu/seo/json-ld';
import { createMetadata } from '@delulu/seo/metadata';
import { allBlogs } from 'content-collections';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
      type: 'article',
      publishedTime: blog.date,
      authors: [blog.author],
      tags: blog.categories,
      siteName: 'Delulu Blog',
      locale: locale,
      url: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    category: blog.categories[0] ?? 'Blog',
    applicationName: 'Delulu Social',
    abstract: blog.description,
    creator: blog.author,
    twitter: {
      card: 'summary_large_image',
      creator: blog.author,
      images: [
        {
          url: blog.image,
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

type PageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { slug, locale } = await params;
  const blog = allBlogs.find((b) => b.slug === slug);
  if (!blog) {
    return notFound();
  }

  const blogWithType = {
    ...blog,
    type: 'blog' as const,
  };

  // Create JSON-LD structured data
  const articleJsonLd: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.description,
    image: blog.image,
    datePublished: blog.date,
    dateModified: blog.date,
    author: {
      '@type': 'Person',
      name: blog.author,
      image: blog.authorAvatar,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Delulu',
      logo: {
        '@type': 'ImageObject',
        url: `${url.origin}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': new URL(`/blog/${slug}`, url).href,
    },
    keywords: blog.keywords,
    articleSection: blog.categories[0] || 'Blog',
    inLanguage: locale,
  };

  return (
    <div>
      <JsonLd code={articleJsonLd} />
      <BlogLayout blog={blogWithType}>
        <MDXContent components={components} code={blog.body} />
      </BlogLayout>
      <div className="py-20">
        <CTA />
      </div>
    </div>
  );
}
