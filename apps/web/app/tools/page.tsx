import { type ItemList, JsonLd, type WithContext } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Balancer from "react-wrap-balancer";
import { ToolCard } from "@/components/tools/tool-card";
import { featuredTools } from "@/lib/tools";

const featured = featuredTools();

export const metadata: Metadata = createMetadata({
  title: "Free Social Media Planning & Video Tools",
  description:
    "Plan a visual social feed or trim a video for your next post. Free browser-based tools for creators, social media managers, and small businesses.",
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent("Plan and prepare your next post")}&description=${encodeURIComponent("Free feed planning and video tools for social content")}`
  ),
  alternates: {
    canonical: getWebUrl("/tools"),
  },
  openGraph: {
    title: "Free Social Media Planning & Video Tools | Delulu Social",
    description:
      "Plan a visual social feed or trim a video for your next post. Free browser-based tools for creators, social media managers, and small businesses.",
    type: "website",
    url: getWebUrl("/tools"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Social Media Planning & Video Tools | Delulu Social",
    description:
      "Plan a visual social feed or trim a video for your next post—free in your browser.",
  },
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free social media planning and video tools",
  itemListElement: featured.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.description,
    url: getWebUrl(tool.href),
  })),
};

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl border-border border-x border-dashed px-4 py-16">
      <JsonLd code={itemListSchema} />

      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1 className="font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
          <Balancer>Plan and prepare your next post</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>
            Preview a visual feed or trim a video without signing up. Your media
            stays private while you decide what to publish next.
          </Balancer>
        </p>
      </div>

      <section>
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          Start with these
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </main>
  );
}
