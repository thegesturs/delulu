import { api } from "@delulu/database/convex/_generated/api";
import { allBlogs, allLegals } from "content-collections";
import type { MetadataRoute } from "next";
import { env } from "@/env";
import { convex } from "@/lib/convex";

// Static list of known pages to avoid filesystem access in edge runtime
const pages = ["blogs", "pricing", "contact"];
const blogs = allBlogs.map((blog) => blog.slug);
const legals = allLegals.map((legal) => legal.slug);

const url = new URL(`${env.NEXT_PUBLIC_WEB_URL}`);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  // Fetch Outrank article slugs from Convex
  const convexArticles = await convex.query(api.articles.getAllArticles);
  const convexSlugs = convexArticles.map((a) => a.slug);

  return [
    {
      url: new URL("/", url).href,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: new URL("/pricing", url).href,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: new URL("/contact", url).href,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...pages
      .filter((page) => !["pricing", "contact"].includes(page))
      .map((page) => ({
        url: new URL(page, url).href,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...blogs.map((blog) => ({
      url: new URL(`blog/${blog}`, url).href,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...convexSlugs.map((slug) => ({
      url: new URL(`blog/${slug}`, url).href,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...legals.map((legal) => ({
      url: new URL(`legal/${legal}`, url).href,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
};

export default sitemap;
