import { type ItemList, JsonLd, type WithContext } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import Balancer from "react-wrap-balancer";
import { ToolCard } from "@/components/tools/tool-card";
import { tools } from "@/lib/tools";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social";

export const metadata: Metadata = createMetadata({
  title: "Free Social Media & Video Tools",
  description:
    "A growing collection of free, no-signup tools for creators — trim YouTube videos in your browser, and more. Fast, private, and built by Delulu Social.",
  alternates: {
    canonical: `${WEB_URL}/tools`,
  },
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Tools by Delulu Social",
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.description,
    url: `${WEB_URL}/tools/${tool.slug}`,
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
            No signup, no watermarks, no uploads to a server. Just fast little
            tools that do one job well — starting with video.
          </Balancer>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  );
}
