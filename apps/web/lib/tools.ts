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

export type ToolCategory = "video" | "text" | "image" | "seo" | "research";

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
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: "Video",
  text: "Text & Captions",
  image: "Image",
  seo: "SEO",
  research: "News & Research",
};

export const tools: Tool[] = [
  {
    slug: "news-explorer",
    title: "News Explorer",
    description:
      "Explore fresh headlines by country and topic, open the original reporting, and turn a story into a social post — free, with no signup.",
    category: "research",
    icon: "newspaper",
    keywords: [
      "news explorer",
      "latest news by country",
      "world news headlines",
      "news by category",
      "free news feed",
    ],
    status: "live",
  },
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
];

export const getTool = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.slug === slug);

export const liveTools = (): Tool[] =>
  tools.filter((tool) => tool.status !== "coming-soon");
