import { BlogCard } from '@/components/blog/blog-card';
import { getDictionary } from '@delulu/internationalization';
import type { Blog, WithContext } from '@delulu/seo/json-ld';
import { JsonLd } from '@delulu/seo/json-ld';
import { createMetadata } from '@delulu/seo/metadata';
import { allBlogs } from 'content-collections';
import type { Metadata } from 'next';

type BlogProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: BlogProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createMetadata(dictionary.web.blog.meta);
};

const BlogIndex = async ({ params }: BlogProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const jsonLd: WithContext<Blog> = {
    '@type': 'Blog',
    '@context': 'https://schema.org',
  };

  return (
    <>
      <JsonLd code={jsonLd} />
      <div className="w-full py-20 lg:py-40">
        <div className="container mx-auto flex flex-col gap-14">
          <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="max-w-xl font-regular text-3xl tracking-tighter md:text-5xl">
              {dictionary.web.blog.meta.title}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {allBlogs.map((blog) => (
              <BlogCard key={blog.slug} blog={blog} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogIndex;
