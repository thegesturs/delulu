/**
 * Registry of free marketing tools.
 *
 * Single source of truth consumed by:
 *  - the `/tools` hub index (`app/tools/page.tsx`)
 *  - the sitemap (`app/sitemap.ts`)
 *  - per-tool metadata / page copy
 *
 * Keep this file server-safe (no "use client", no React imports) so it can be
 * imported by `sitemap.ts`, which runs in the Cloudflare Worker. Platform names
 * stay serializable and are resolved to the shared branded logos by ToolCard.
 */

import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { feedPlannerPages } from "@/app/tools/feed-planners/utils/feed-planner-pages";

export type ToolCategory = "video" | "text" | "image" | "seo" | "planning";

export interface ToolCardItem {
  slug: string;
  href: string;
  title: string;
  description: string;
  cta: string;
  category: ToolCategory;
  socialPlatforms?: SupportedSocialPlatform[];
  status?: "live" | "coming-soon";
}

export interface Tool extends ToolCardItem {
  /** One-line description used on cards and in meta descriptions. */
  keywords?: string[];
  family?: { title: string; href: string };
}

export type ToolFamily = ToolCardItem;

export const toolFamilies: ToolFamily[] = [
  {
    slug: "feed-planners",
    href: "/tools/feed-planners",
    title: "Feed Planning",
    description:
      "Arrange photos and videos in a profile grid or scrolling feed before you publish.",
    cta: "Choose a feed planner",
    category: "planning",
    socialPlatforms: ["INSTAGRAM", "FACEBOOK", "LINKEDIN"],
  },
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: "Video Editing",
  text: "Caption & Text",
  image: "Image Editing",
  seo: "Search Optimization",
  planning: "Feed Planning",
};

export const tools: Tool[] = [
  {
    slug: "youtube-video-trimmer",
    href: "/tools/youtube-video-trimmer",
    title: "YouTube Video Trimmer",
    description:
      "Trim any YouTube video or uploaded clip right in your browser — no watermark, no signup, no upload to a server.",
    cta: "Trim a video",
    category: "video",
    socialPlatforms: ["YOUTUBE"],
    keywords: [
      "youtube video trimmer",
      "trim youtube video online",
      "cut youtube video",
      "video trimmer online free",
      "trim video in browser",
      "clip youtube video",
    ],
    status: "live",
  },
  ...feedPlannerPages.map(
    (page): Tool => ({
      slug: page.slug,
      href: `/tools/feed-planners/${page.slug}`,
      title: page.title,
      description: page.description,
      cta:
        page.variant === "grid"
          ? "Plan an Instagram grid"
          : "Preview a scrolling feed",
      category: "planning",
      socialPlatforms:
        page.variant === "grid"
          ? ["INSTAGRAM"]
          : ["INSTAGRAM", "FACEBOOK", "LINKEDIN"],
      keywords: page.keywords,
      status: "live",
      family: {
        title: "Feed Planning",
        href: "/tools/feed-planners",
      },
    })
  ),
];

export const getTool = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.slug === slug);

export const liveTools = (): Tool[] =>
  tools.filter((tool) => tool.status !== "coming-soon");
