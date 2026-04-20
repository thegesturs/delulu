import { api } from "@delulu/database/convex/_generated/api";
import { createBlogSchema, JsonLd } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { allBlogs } from "content-collections";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/blog-card";
import {
  adaptContentCollectionsBlog,
  adaptConvexArticlePreview,
} from "@/types/blog";

// ISR: regenerate at most hourly, serve stale in the meantime.
export const revalidate = 3600;

export const metadata: Metadata = createMetadata({
  title: "Blog",
  description:
    "Discover the latest insights, tips, and strategies for social media management, content creation, and digital marketing. Learn how to grow your audience across all major social platforms.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social"}/blogs`,
  },
});

const BlogIndex = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social";
  const blogUrl = `${baseUrl}/blogs`;

  // Preview shape only — no article bodies. Cached by Next.js ISR.
  const convexArticles = await fetchQuery(api.articles.getArticlesPreviewList, {
    limit: 100,
  });

  // Adapt both sources to unified type
  const ccBlogs = allBlogs.map(adaptContentCollectionsBlog);
  const outBlogs = convexArticles.map(adaptConvexArticlePreview);

  // Merge and sort by date descending
  const allPosts = [...ccBlogs, ...outBlogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const blogSchema = createBlogSchema({
    title: "Delulu Social Blog",
    description:
      "Expert insights and practical tips for social media management, content creation, and digital marketing across all major platforms.",
    url: blogUrl,
    posts: allPosts.map((blog) => ({
      title: blog.title,
      url: `${baseUrl}/blog/${blog.slug}`,
      datePublished: blog.date,
      author: blog.author,
    })),
  });

  return (
    <>
      <JsonLd code={blogSchema} />
      <div className="w-full py-20 lg:py-40">
        <div className="container mx-auto flex flex-col gap-14">
          <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4">
              <h1 className="max-w-xl font-regular text-3xl tracking-tighter md:text-5xl">
                Blog
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Discover the latest insights, tips, and strategies for social
                media management and content creation.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {allPosts.map((blog) => (
              <BlogCard blog={blog} key={blog.slug} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogIndex;
