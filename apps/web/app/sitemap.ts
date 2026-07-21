import { getWebUrl } from "@delulu/seo/url";
import { allBlogs, allLegals } from "content-collections";
import type { MetadataRoute } from "next";
import { features } from "@/app/features/features";
import { integrationPages } from "@/app/integrations/_lib/integration-pages";
import {
  indexableNewsRoutes,
  newsRoutePath,
} from "@/app/tools/news-explorer/utils/config";
import { hasUsableCachedNews } from "@/app/tools/news-explorer/utils/service";
import { fetchArticlePreviews } from "@/lib/articles";
import { getToolHref, liveTools, toolFamilies } from "@/lib/tools";

const pages = ["blogs", "pricing", "contact", "affiliates"];
const blogs = allBlogs.map((blog) => ({ slug: blog.slug, date: blog.date }));
const legals = allLegals.map((legal) => legal.slug);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const outrankPreviews = await fetchArticlePreviews();
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
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getWebUrl("/pricing"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getWebUrl("/contact"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: getWebUrl("/tools"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getWebUrl("/features"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...features.map((feature) => ({
      url: getWebUrl(`/features/${feature.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: getWebUrl("/integrations"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...integrationPages.map((integration) => ({
      url: getWebUrl(`/integrations/${integration.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...toolFamilies.map((family) => ({
      url: getWebUrl(`/tools/${family.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...liveTools()
      .filter((tool) => tool.family?.slug !== "news-explorer")
      .map((tool) => ({
        url: getWebUrl(getToolHref(tool)),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ...completeNewsRoutes.map(({ route }) => ({
      url: getWebUrl(newsRoutePath(route)),
      changeFrequency: "hourly" as const,
      priority: route.country || route.category ? 0.65 : 0.75,
    })),
    ...pages
      .filter((page) => !["pricing", "contact"].includes(page))
      .map((page) => ({
        url: getWebUrl(`/${page}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...blogs.map((blog) => ({
      url: getWebUrl(`/blog/${blog.slug}`),
      lastModified: new Date(blog.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...outrankPreviews.map((article) => ({
      url: getWebUrl(`/blog/${article.slug}`),
      lastModified: new Date(article.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...legals.map((legal) => ({
      url: getWebUrl(`/legal/${legal}`),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
};

export default sitemap;
