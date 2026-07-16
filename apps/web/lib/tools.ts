/**
 * Registry of free marketing tools.
 *
 * Keep this module server-safe. Icons are stored as string keys and resolved
 * by the tool-card component.
 */

import { holidayCalendarRegistry } from "@/app/tools/holiday-calendar/_utils/registry";
import { textTools } from "@/app/tools/text-tools/utils/text-tools";

export type ToolCategory = "video" | "text" | "image" | "seo" | "calendar";

export interface ToolFamily {
  slug: string;
  title: string;
  description: string;
  relatedHeading: string;
  icon: string;
}

export interface Tool {
  slug: string;
  /** Canonical route. Defaults to /tools/{slug} for legacy tools. */
  href?: string;
  title: string;
  description: string;
  category: ToolCategory;
  icon: string;
  keywords?: string[];
  status?: "live" | "coming-soon";
  family?: ToolFamily;
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: "Video",
  text: "Caption & Text",
  image: "Image",
  seo: "SEO",
  calendar: "Calendar",
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

export const toolFamilies: ToolFamily[] = [
  textToolsFamily,
  holidayCalendarFamily,
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
    slug: "youtube-video-trimmer",
    title: "YouTube Video Trimmer",
    description:
      "Trim any YouTube video or uploaded clip right in your browser — no watermark, no signup, no upload to a server.",
    category: "video",
    icon: "scissors",
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
];

export const getToolHref = (tool: Tool): string =>
  tool.href ?? `/tools/${tool.slug}`;

export const getTool = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.slug === slug);

export const getToolFamily = (slug: string): ToolFamily | undefined =>
  toolFamilies.find((family) => family.slug === slug);

export const liveTools = (): Tool[] =>
  tools.filter((tool) => tool.status !== "coming-soon");
