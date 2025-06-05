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
  const { slug } = await params;
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
    openGraph: {
      type: 'article',
      publishedTime: blog.date,
      authors: [blog.author],
      tags: blog.categories,
    },
    twitter: {
      card: 'summary_large_image',
      images: [
        {
          url: blog.image,
          alt: blog.title,
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
  const { slug } = await params;
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
