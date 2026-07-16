import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { type ItemList, JsonLd, type WithContext } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ToolCard, ToolIcon } from "@/components/tools/tool-card";
import { featuredTools, toolFamilies } from "@/lib/tools";

export const metadata: Metadata = createMetadata({
  title: "Free Social Media Tools for Creators",
  description:
    "Find the right free tool for your next social post. Plan timely content, trim video, and start creating without signup or watermarks.",
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent("Free Social Media Tools")}&description=${encodeURIComponent("Plan, create, and publish your next post")}`
  ),
  alternates: {
    canonical: getWebUrl("/tools"),
  },
  openGraph: {
    type: "website",
    url: getWebUrl("/tools"),
  },
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Tools by Delulu Social",
  itemListElement: toolFamilies.map((family, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: family.title,
    description: family.description,
    url: getWebUrl(`/tools/${family.slug}`),
  })),
};

const popularTools = featuredTools();

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl border-border border-x border-dashed px-4 py-16">
      <JsonLd code={itemListSchema} />

      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1 className="font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
          <Balancer>What do you want to create?</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>
            Pick a task and get started. These tools are free, work without
            signup, and put the useful part first.
          </Balancer>
        </p>
      </div>

      <section>
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          Browse by task
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolFamilies.map((family) => (
            <Link href={`/tools/${family.slug}`} key={family.slug}>
              <Card className="group h-full transition-colors hover:border-primary/60">
                <CardHeader>
                  <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ToolIcon name={family.icon} />
                  </span>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {family.title}
                    <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-6">
                    {family.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-2 font-bold text-2xl tracking-tight">
          Popular tools
        </h2>
        <p className="mb-5 text-muted-foreground">
          Start quickly with the tasks creators use most.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </main>
  );
}
