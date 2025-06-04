import { IconArrowLeft } from "@tabler/icons-react";
import Image from "next/image";
import { format } from "date-fns";
import { BlogCardVertical } from "./blog-card";
import { allBlogs, Blog } from "content-collections";
import Link from "next/link";
import { Logo } from "../logo";

export async function BlogLayout({
  blog,
  children,
}: {
  blog: Blog;
  children: React.ReactNode;
}) {
  const relatedBlogs = allBlogs.slice(0, 3);

  return (
    <div className="mt-16 lg:mt-14 max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center px-2 py-8">
        <Link href="/blog" className="flex space-x-2 items-center">
          <IconArrowLeft className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Back</span>
        </Link>
      </div>
      <div className="w-full mx-auto">
        {blog.image ? (
          <Image
            src={blog.image}
            height="800"
            width="800"
            className="h-40 md:h-96 w-full aspect-square object-cover rounded-3xl"
            alt={blog.title}
          />
        ) : (
          <div className="h-40 md:h-96 w-full aspect-squace rounded-3xl shadow-lg bg-gray-100 flex items-center justify-center">
            <Logo />
          </div>
        )}
      </div>
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <article className="pb-8 pt-8">
            <div className="flex gap-4 flex-wrap">
              {blog.categories?.map((category, idx) => (
                <p
                  key={`category-${idx}`}
                  className="text-xs font-bold text-gray-600 px-2 py-1 rounded-full bg-gray-100 capitalize"
                >
                  {category}
                </p>
              ))}
            </div>
            <header className="flex flex-col">
              <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                {blog.title}
              </h1>
            </header>
            <div className="mt-8 prose prose-sm" data-mdx-content>
              {children}
            </div>
            <div className="flex space-x-2 items-center pt-12 border-t border-gray-200 mt-12">
              <div className="flex space-x-2 items-center">
                <Image
                  src={blog.authorAvatar}
                  alt={blog.author}
                  width={20}
                  height={20}
                  className="rounded-full h-5 w-5"
                />
                <p className="text-sm font-normal text-gray-600">
                  {blog.author}
                </p>
              </div>
              <div className="h-5 rounded-lg w-0.5 bg-gray-200" />
              <time
                dateTime={blog.date}
                className="flex items-center text-base"
              >
                <span className="text-gray-600 text-sm">
                  {format(new Date(blog.date), "MMMM dd, yyyy")}
                </span>
              </time>
            </div>
          </article>
        </div>
      </div>
      {relatedBlogs.length > 0 && (
        <div className="mt-12 pb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">
            Related Blogs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {relatedBlogs.map((blog) => (
              <BlogCardVertical key={blog.slug} blog={blog} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
