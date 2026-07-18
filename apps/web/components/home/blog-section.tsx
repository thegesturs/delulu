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
    <section className="w-full border-t px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-14">
        <div className="flex max-w-3xl flex-col gap-5">
          <p className="font-medium text-primary text-sm uppercase tracking-[0.18em]">
            From the field
          </p>
          <h2 className="font-medium text-4xl tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Ideas for handing social to your agent.
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground leading-8">
            Practical notes on agent workflows, reliable publishing, and
            building a social system your team can trust.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((blog) => (
            <BlogCardVertical blog={blog} key={blog.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
