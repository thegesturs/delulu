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
  title: "Free Social Media & Video Tools",
  description:
    "Free, no-signup tools for creators — count and format social text, shape platform-ready captions, and trim video privately in your browser.",
  alternates: {
    canonical: getWebUrl("/tools"),
  },
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Tools by Delulu Social",
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
          <Balancer>Free tools for creators</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>
            No signup, no watermarks, and private browser-based processing where
            practical. Count, format, and prepare social content with focused
            tools that do one job well.
          </Balancer>
        </p>
      </div>

      <section className="mb-14">
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          Browse by family
        </h2>
        <Link
          className="group block rounded-xl border bg-card p-6 transition-colors hover:border-primary/60"
          href="/tools/text-tools"
        >
          <p className="font-semibold text-xl">Social media text tools</p>
          <p className="mt-2 max-w-2xl text-muted-foreground leading-7">
            Count platform-specific captions, bios, titles, and descriptions;
            measure words and hashtags; or generate copy-ready line breaks, bold
            text, and italic text.
          </p>
          <span className="mt-4 inline-block font-medium text-primary text-sm group-hover:underline">
            Explore all 13 text tools →
          </span>
        </Link>
      </section>

      <section>
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          Popular tools
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
