import { type ItemList, JsonLd, type WithContext } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Balancer from "react-wrap-balancer";
import { ToolCard } from "@/components/tools/tool-card";
import { tools } from "@/lib/tools";

export const metadata: Metadata = createMetadata({
  title: "Free Tools for Social Media Work",
  description:
    "Find the right free tool for the job: browse current headlines, trim a video, and turn your work into a social post. No signup required.",
  alternates: {
    canonical: getWebUrl("/tools"),
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
    url: getWebUrl(`/tools/${tool.slug}`),
  })),
};

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl border-border border-x border-dashed px-4 py-16">
      <JsonLd code={itemListSchema} />

      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1 className="font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
          <Balancer>What do you want to make today?</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>
            Browse current headlines for a post idea or trim a video for your
            next campaign. These free tools get you to the work quickly, with no
            signup required.
          </Balancer>
        </p>
      </div>

      <h2 className="mb-5 font-bold text-2xl tracking-tight">Choose a task</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  );
}
