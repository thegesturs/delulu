import { allBlogs } from "content-collections";
import { BlogCardVertical } from "@/components/blog/blog-card";
import { fetchArticlePreviews } from "@/lib/articles";
import { adaptContentCollectionsBlog, adaptOutrankPreview } from "@/types/blog";

export async function BlogSection() {
  // Preview shape only — no article bodies. Cached by ISR on the calling page.
  const outrankPreviews = await fetchArticlePreviews(3);

  const ccBlogs = allBlogs.map(adaptContentCollectionsBlog);
  const outBlogs = outrankPreviews.map(adaptOutrankPreview);

  const recentPosts = [...ccBlogs, ...outBlogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentPosts.length === 0) {
    return null;
  }

  return (
    <section className="w-full border-t px-4 py-20 lg:py-28">
      <div className="container mx-auto flex flex-col gap-14">
        <div className="flex flex-col gap-4">
          <h2 className="max-w-xl font-regular text-3xl tracking-tighter md:text-5xl">
            Latest from the Blog
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Tips, strategies, and insights for growing your social media
            presence.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {recentPosts.map((blog) => (
            <BlogCardVertical blog={blog} key={blog.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
