import { type ItemList, JsonLd, type WithContext } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ToolCard } from "@/components/tools/tool-card";
import { getTool, getToolHref } from "@/lib/tools";

const featuredTools = [
  getTool("instagram-caption-character-counter"),
  getTool("word-counter"),
  getTool("bold-text-generator"),
  getTool("youtube-video-trimmer"),
].filter((tool) => tool !== undefined);

export const metadata: Metadata = createMetadata({
  title: "Free Social Media Tools for Captions, Text & Video",
  description:
    "Count a caption, format social text, or trim a video now. Free creator tools with no signup and private browser processing where practical.",
  image: getWebUrl(
    "/api/og?title=Free%20Social%20Media%20Tools&description=Count%20captions%2C%20format%20text%2C%20and%20trim%20video"
  ),
  alternates: {
    canonical: getWebUrl("/tools"),
  },
  openGraph: { url: getWebUrl("/tools") },
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free social media tools for creators",
  itemListElement: featuredTools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.description,
    url: getWebUrl(getToolHref(tool)),
  })),
};

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl border-border border-x border-dashed px-4 py-16">
      <JsonLd code={itemListSchema} />

      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1 className="font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
          <Balancer>Create better social content, faster</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>
            Choose what you need to finish: check a caption, format text, or
            trim a video. Start immediately—no signup required.
          </Balancer>
        </p>
      </div>

      <section className="mb-14">
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          What are you working on?
        </h2>
        <Link
          className="group block rounded-xl border bg-card p-6 transition-colors hover:border-primary/60"
          href="/tools/text-tools"
        >
          <p className="font-semibold text-xl">Caption &amp; Text</p>
          <p className="mt-2 max-w-2xl text-muted-foreground leading-7">
            Count platform-specific captions, bios, titles, and descriptions;
            measure words and hashtags; or generate copy-ready line breaks, bold
            text, and italic text.
          </p>
          <span className="mt-4 inline-block font-medium text-primary text-sm group-hover:underline">
            Choose a caption or text task →
          </span>
        </Link>
      </section>

      <section>
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          Start with a popular task
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </main>
  );
}
