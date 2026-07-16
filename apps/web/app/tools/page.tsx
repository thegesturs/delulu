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
import { getTool, toolFamilies } from "@/lib/tools";

const popularTools = [
  getTool("instagram-caption-character-counter"),
  getTool("word-counter"),
  getTool("youtube-video-trimmer"),
  getTool("social-media-holiday-calendar"),
  getTool("social-media-awareness-days-calendar"),
].filter((tool) => tool !== undefined);

export const metadata: Metadata = createMetadata({
  title: "Free Social Media Tools for Captions, Calendars & Video",
  description:
    "Check captions, format social text, find reliable content dates, or trim a video. Free creator tools with no signup required.",
  image: getWebUrl(
    "/api/og?title=Free%20Social%20Media%20Tools&description=Plan%20dates%2C%20check%20captions%2C%20format%20text%2C%20and%20trim%20video"
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
  name: "Free social media tools for creators",
  itemListElement: toolFamilies.map((family, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: family.title,
    description: family.description,
    url: getWebUrl(`/tools/${family.slug}`),
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
            Choose what you need to finish: check a caption, format text, find a
            timely date, or trim a video. Start immediately—no signup required.
          </Balancer>
        </p>
      </div>

      <section>
        <h2 className="mb-5 font-bold text-2xl tracking-tight">
          Browse by task
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolFamilies.map((family) => (
            <Link
              className="block h-full"
              href={`/tools/${family.slug}`}
              key={family.slug}
            >
              <Card className="group h-full transition-colors hover:border-primary/60">
                <CardHeader>
                  <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                    <ToolIcon name={family.icon} />
                  </span>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {family.title}
                    <ArrowRight
                      aria-hidden
                      className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                    />
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
          Start with a popular task
        </h2>
        <p className="mb-5 text-muted-foreground">
          Open a frequently used tool and get straight to the work.
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
