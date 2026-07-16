import { holidayCalendarRegistry } from "@/app/tools/holiday-calendar/_utils/registry";

/**
 * Registry of free marketing tools.
 *
 * Single source of truth consumed by:
 *  - the `/tools` hub index (`app/tools/page.tsx`)
 *  - the sitemap (`app/sitemap.ts`)
 *  - per-tool metadata / page copy
 *
 * Keep this file server-safe (no "use client", no React imports) so it can be
 * imported by `sitemap.ts`, which runs in the Cloudflare Worker. Icons are
 * referenced by string key and resolved in the client `tool-card` component.
 */

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
  title: string;
  /** One-line description used on cards and in meta descriptions. */
  description: string;
  category: ToolCategory;
  /** Icon key mapped to a component in `components/tools/tool-card.tsx`. */
  icon: string;
  keywords?: string[];
  status?: "live" | "coming-soon";
  family?: string;
  featured?: boolean;
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: "Video",
  text: "Text & Captions",
  image: "Image",
  seo: "SEO",
  calendar: "Calendar",
};

export const toolFamilies: ToolFamily[] = [
  {
    slug: "holiday-calendar",
    title: "Social Calendar",
    description:
      "Find reliable dates for timely posts, from global awareness days to U.S., India, and seasonal calendars.",
    relatedHeading: "More social calendars",
    icon: "calendar",
  },
];

const featuredCalendarSlugs = new Set([
  "social-media-holiday-calendar",
  "social-media-awareness-days-calendar",
]);

const holidayCalendarTools: Tool[] = holidayCalendarRegistry.map((page) => ({
  slug: page.slug,
  title: page.title,
  description: page.description,
  category: "calendar",
  icon: "calendar",
  keywords: [...page.keywords],
  status: "live",
  family: "holiday-calendar",
  featured: featuredCalendarSlugs.has(page.slug),
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
    featured: true,
  },
  ...holidayCalendarTools,
];

export const getToolPath = (tool: Tool): string =>
  tool.family ? `/tools/${tool.family}/${tool.slug}` : `/tools/${tool.slug}`;

export const getTool = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.slug === slug);

export const getToolFamily = (slug: string): ToolFamily | undefined =>
  toolFamilies.find((family) => family.slug === slug);

export const liveTools = (): Tool[] =>
  tools.filter((tool) => tool.status !== "coming-soon");

export const featuredTools = (): Tool[] =>
  liveTools().filter((tool) => tool.featured);
