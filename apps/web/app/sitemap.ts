import { getWebUrl } from "@delulu/seo/url";
import { allBlogs, allLegals } from "content-collections";
import type { MetadataRoute } from "next";
import {
  indexableNewsRoutes,
  NEWS_FAMILY_PATH,
  newsRoutePath,
} from "@/app/tools/news-explorer/utils/config";
import { hasUsableCachedNews } from "@/app/tools/news-explorer/utils/service";
import { fetchArticlePreviews } from "@/lib/articles";
import { tools } from "@/lib/tools";

// Static list of known pages to avoid filesystem access in edge runtime
const pages = ["blogs", "pricing", "contact", "affiliates"];
const blogs = allBlogs.map((blog) => blog.slug);
const legals = allLegals.map((legal) => legal.slug);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  // Fetch Outrank article slugs from KV (preview index)
  const outrankPreviews = await fetchArticlePreviews();
  const outrankSlugs = outrankPreviews.map((a) => a.slug);
  const completeNewsRoutes = (
    await Promise.all(
      indexableNewsRoutes().map(async (route) => ({
        route,
        complete: await hasUsableCachedNews(route),
      }))
    )
  ).filter(({ complete }) => complete);

  return [
    {
      url: getWebUrl(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getWebUrl("/pricing"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getWebUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getWebUrl("/tools"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...tools
      .filter((tool) => tool.slug !== "news-explorer")
      .map((tool) => ({
        url: getWebUrl(`/tools/${tool.slug}`),
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    {
      url: getWebUrl(NEWS_FAMILY_PATH),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...completeNewsRoutes.map(({ route }) => ({
      url: getWebUrl(newsRoutePath(route)),
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: route.country || route.category ? 0.65 : 0.75,
    })),
    ...pages
      .filter((page) => !["pricing", "contact"].includes(page))
      .map((page) => ({
        url: getWebUrl(`/${page}`),
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...blogs.map((blog) => ({
      url: getWebUrl(`/blog/${blog}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...outrankSlugs.map((slug) => ({
      url: getWebUrl(`/blog/${slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...legals.map((legal) => ({
      url: getWebUrl(`/legal/${legal}`),
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
};

export default sitemap;
