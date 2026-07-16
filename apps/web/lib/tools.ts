/**
 * Registry of free marketing tools.
 *
 * Keep this module server-safe. Icons are stored as string keys and resolved
 * by the tool-card component.
 */

import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { feedPlannerPages } from "@/app/tools/feed-planners/utils/feed-planner-pages";
import { holidayCalendarRegistry } from "@/app/tools/holiday-calendar/_utils/registry";
import { socialPreviewTools } from "@/app/tools/social-previews/utils/social-preview-tools";
import { textTools } from "@/app/tools/text-tools/utils/text-tools";

export type ToolCategory =
  | "video"
  | "text"
  | "image"
  | "seo"
  | "research"
  | "calendar"
  | "planning"
  | "preview";

export interface ToolFamily {
  slug: string;
  title: string;
  description: string;
  relatedHeading: string;
  icon: string;
  cta?: string;
  socialPlatforms?: SupportedSocialPlatform[];
}

export interface Tool {
  slug: string;
  /** Canonical route. Defaults to /tools/{slug} for legacy tools. */
  href?: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: string;
  cta?: string;
  socialPlatforms?: SupportedSocialPlatform[];
  keywords?: string[];
  status?: "live" | "coming-soon";
  family?: ToolFamily;
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: "Video",
  text: "Caption & Text",
  image: "Image",
  seo: "SEO",
  research: "News & Research",
  calendar: "Calendar",
  planning: "Feed Planning",
  preview: "Post Preview",
};

const newsExplorerFamily: ToolFamily = {
  slug: "news-explorer",
  title: "News Content Ideas",
  description:
    "Find timely news-based content ideas by country or topic, read the original reporting, and create an attributed social media draft.",
  relatedHeading: "More news content ideas",
  icon: "newspaper",
  cta: "Browse headlines",
};

const feedPlannersFamily: ToolFamily = {
  slug: "feed-planners",
  title: "Feed Planning",
  description:
    "Arrange photos and videos in a profile grid or scrolling feed before you publish.",
  relatedHeading: "More ways to preview your feed",
  icon: "instagram",
  cta: "Choose a feed planner",
  socialPlatforms: ["INSTAGRAM", "FACEBOOK", "LINKEDIN"],
};

const textToolsFamily: ToolFamily = {
  slug: "text-tools",
  title: "Caption & Text",
  description:
    "Check caption length, count words, and format social text before you publish.",
  relatedHeading: "More caption and text tools",
  icon: "type",
};

const holidayCalendarFamily: ToolFamily = {
  slug: "holiday-calendar",
  title: "Social Calendar",
  description:
    "Find reliable dates for timely posts, from global awareness days to U.S., India, and seasonal calendars.",
  relatedHeading: "More social calendars",
  icon: "calendar",
};

const socialPreviewsFamily: ToolFamily = {
  slug: "social-previews",
  title: "Post Previews",
  description:
    "See how posts and profiles will read across each social channel before you publish.",
  relatedHeading: "More post previews",
  icon: "instagram",
};

export const toolFamilies: ToolFamily[] = [
  newsExplorerFamily,
  feedPlannersFamily,
  textToolsFamily,
  holidayCalendarFamily,
  socialPreviewsFamily,
];

const holidayCalendarTools: Tool[] = holidayCalendarRegistry.map((page) => ({
  slug: page.slug,
  href: `/tools/holiday-calendar/${page.slug}`,
  title: page.title,
  description: page.description,
  category: "calendar",
  icon: "calendar",
  keywords: [...page.keywords],
  status: "live",
  family: holidayCalendarFamily,
}));

export const tools: Tool[] = [
  {
    slug: "latest-news-content-ideas",
    href: "/tools/news-explorer/latest-news-content-ideas",
    title: "Latest News Content Ideas for Social Media",
    description:
      "Find timely news-based content ideas, open the original reporting, and create an attributed social media draft — free, with no signup.",
    category: "research",
    icon: "newspaper",
    cta: "Browse latest headlines",
    keywords: [
      "news content ideas for social media",
      "latest news content ideas",
      "news stories to share on social media",
      "current events content ideas",
      "news-based social media posts",
    ],
    status: "live",
    family: newsExplorerFamily,
  },
  {
    slug: "youtube-video-trimmer",
    title: "YouTube Video Trimmer",
    description:
      "Trim any YouTube video or uploaded clip right in your browser — no watermark, no signup, no upload to a server.",
    category: "video",
    icon: "youtube",
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
      icon: "instagram",
      socialPlatforms:
        page.variant === "grid"
          ? ["INSTAGRAM"]
          : ["INSTAGRAM", "FACEBOOK", "LINKEDIN"],
      keywords: page.keywords,
      status: "live",
      family: feedPlannersFamily,
    })
  ),
  ...textTools.map((tool) => ({
    slug: tool.slug,
    href: `/tools/text-tools/${tool.slug}`,
    title: tool.title,
    description: tool.description,
    category: "text" as const,
    icon: tool.cardIcon,
    keywords: tool.keywords,
    status: "live" as const,
    family: textToolsFamily,
  })),
  ...holidayCalendarTools,
  ...socialPreviewTools.map((tool) => ({
    slug: `social-previews/${tool.slug}`,
    href: `/tools/social-previews/${tool.slug}`,
    title: tool.title,
    description: tool.description,
    category: "preview" as const,
    icon: tool.platform.toLowerCase(),
    keywords: tool.keywords,
    status: "live" as const,
    family: socialPreviewsFamily,
  })),
];

export const getToolHref = (tool: Tool): string =>
  tool.href ?? `/tools/${tool.slug}`;

export const getTool = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.slug === slug);

export const getToolFamily = (slug: string): ToolFamily | undefined =>
  toolFamilies.find((family) => family.slug === slug);

export const liveTools = (): Tool[] =>
  tools.filter((tool) => tool.status !== "coming-soon");
