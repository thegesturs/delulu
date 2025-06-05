import { type Blog, type Legal, allBlogs } from 'content-collections';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { Logo } from '../logo';
import { BlogCardVertical } from './blog-card';

type BlogWithType = Blog & { type: 'blog' };
type LegalWithType = Legal & { type: 'legal' };
type ContentType = BlogWithType | LegalWithType;

export async function BlogLayout({
  blog,
  children,
}: {
  blog: ContentType;
  children: React.ReactNode;
}) {
  const relatedBlogs = blog.type === 'blog' ? allBlogs.slice(0, 3) : [];

  return (
    <div className="mx-auto mt-16 max-w-6xl px-4 lg:mt-14">
      <div className="flex items-center justify-between px-2 py-8">
        <Link
          href={blog.type === 'blog' ? '/blog' : '/legal'}
          className="flex items-center space-x-2"
        >
          <FaArrowLeft className="h-4 w-4 text-gray-500" />
          <span className="text-gray-500 text-sm">Back</span>
        </Link>
      </div>
      <div className="mx-auto w-full">
        {blog.type === 'blog' && blog.image ? (
          <Image
            src={blog.image}
            height="800"
            width="800"
            className="aspect-square h-40 w-full rounded-3xl object-cover md:h-96"
            alt={blog.title}
          />
        ) : (
          <div className="flex aspect-squace h-40 w-full items-center justify-center rounded-3xl bg-gray-100 shadow-lg md:h-96">
            <Logo />
          </div>
        )}
      </div>
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <article className="pt-8 pb-8">
            {blog.type === 'blog' && blog.categories && (
              <div className="flex flex-wrap gap-4">
                {blog.categories.map((category, idx) => (
                  <p
                    key={`category-${idx}`}
                    className="rounded-full bg-gray-100 px-2 py-1 font-bold text-gray-600 text-xs capitalize"
                  >
                    {category}
                  </p>
                ))}
              </div>
            )}
            <header className="flex flex-col">
              <h1 className="mt-8 font-bold text-4xl text-gray-900 tracking-tight sm:text-5xl">
                {blog.title}
              </h1>
            </header>
            <div className="prose prose-sm mt-8" data-mdx-content>
              {children}
            </div>
            <div className="mt-12 flex items-center space-x-2 border-gray-200 border-t pt-12">
              {blog.type === 'blog' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Image
                      src={blog.authorAvatar}
                      alt={blog.author}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full"
                    />
                    <p className="font-normal text-gray-600 text-sm">
                      {blog.author}
                    </p>
                  </div>
                  <div className="h-5 w-0.5 rounded-lg bg-gray-200" />
                </>
              )}
              <time
                dateTime={blog.date}
                className="flex items-center text-base"
              >
                <span className="text-gray-600 text-sm">
                  {format(new Date(blog.date), 'MMMM dd, yyyy')}
                </span>
              </time>
            </div>
          </article>
        </div>
      </div>
      {blog.type === 'blog' && relatedBlogs.length > 0 && (
        <div className="mt-12 pb-20">
          <h2 className="mb-10 font-bold text-2xl text-gray-900">
            Related Blogs
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {relatedBlogs.map((blog) => (
              <BlogCardVertical key={blog.slug} blog={blog} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
