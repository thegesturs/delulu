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

import { textTools } from "@/app/tools/text-tools/utils/text-tools";

export type ToolCategory = "video" | "text" | "image" | "seo";

export interface Tool {
  slug: string;
  /** Canonical route. Defaults to /tools/{slug} for legacy tools. */
  href?: string;
  title: string;
  /** One-line description used on cards and in meta descriptions. */
  description: string;
  category: ToolCategory;
  /** Icon key mapped to a component in `components/tools/tool-card.tsx`. */
  icon: string;
  keywords?: string[];
  status?: "live" | "coming-soon";
  family?: { slug: string; title: string };
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: "Video",
  text: "Caption & Text",
  image: "Image",
  seo: "SEO",
};

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
    family: { slug: "text-tools", title: "Caption & Text" },
  })),
];

export const getToolHref = (tool: Tool): string =>
  tool.href ?? `/tools/${tool.slug}`;

export const getTool = (slug: string): Tool | undefined =>
  tools.find((tool) => tool.slug === slug);

export const liveTools = (): Tool[] =>
  tools.filter((tool) => tool.status !== "coming-soon");
