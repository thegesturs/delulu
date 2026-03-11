import { allBlogs } from "content-collections";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { adaptContentCollectionsBlog } from "@/types/blog";
import { BlogCardVertical } from "./blog-card";

interface BlogLike {
  type: "blog" | "legal";
  title: string;
  date: string;
  image?: string;
  categories?: string[];
  author?: string;
  authorAvatar?: string;
}

export async function BlogLayout({
  blog,
  children,
}: {
  blog: BlogLike;
  children: React.ReactNode;
}) {
  const relatedBlogs =
    blog.type === "blog"
      ? allBlogs.slice(0, 3).map(adaptContentCollectionsBlog)
      : [];

  return (
    <div className="mx-auto mt-16 max-w-6xl px-4 lg:mt-14">
      <div className="flex items-center justify-between px-2 py-8">
        <Link
          className="flex items-center space-x-2"
          href={blog.type === "blog" ? "/blogs" : "/"}
        >
          <FaArrowLeft className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Back</span>
        </Link>
      </div>
      {blog.type === "blog" && blog.image ? (
        <div className="mx-auto w-full">
          <Image
            alt={blog.title}
            className="aspect-square h-40 w-full rounded-3xl object-cover md:h-96"
            height="800"
            src={blog.image}
            width="800"
          />
        </div>
      ) : null}
      <div className="xl:relative">
        <div className="mx-auto max-w-5xl">
          <article className="pt-8 pb-8">
            {blog.type === "blog" && blog.categories && (
              <div className="flex flex-wrap gap-4">
                {blog.categories.map((category, idx) => (
                  <p
                    className="rounded-full bg-muted px-2 py-1 font-bold text-muted-foreground text-xs capitalize"
                    key={`category-${idx}`}
                  >
                    {category}
                  </p>
                ))}
              </div>
            )}
            <header className="flex flex-col">
              <h1 className="mt-8 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
                {blog.title}
              </h1>
            </header>
            <div className="prose prose-lg mt-8 max-w-none" data-mdx-content>
              {children}
            </div>
            <div className="mt-12 flex items-center space-x-2 border-gray-200 border-t pt-12">
              {blog.type === "blog" && (
                <>
                  <div className="flex items-center space-x-2">
                    {blog.authorAvatar && (
                      <Image
                        alt={blog.author ?? ""}
                        className="h-5 w-5 rounded-full"
                        height={20}
                        src={blog.authorAvatar ?? ""}
                        width={20}
                      />
                    )}
                    <p className="font-normal text-muted-foreground text-sm">
                      {blog.author}
                    </p>
                  </div>
                  <div className="h-5 w-0.5 rounded-lg bg-muted" />
                </>
              )}
              <time
                className="flex items-center text-base"
                dateTime={blog.date}
              >
                <span className="text-muted-foreground text-sm">
                  {format(new Date(blog.date), "MMMM dd, yyyy")}
                </span>
              </time>
            </div>
          </article>
        </div>
      </div>
      {blog.type === "blog" && relatedBlogs.length > 0 && (
        <div className="mt-12 pb-20">
          <h2 className="mb-10 font-bold text-2xl text-foreground">
            Related Blogs
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {relatedBlogs.map((blog) => (
              <BlogCardVertical blog={blog} key={blog.slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
