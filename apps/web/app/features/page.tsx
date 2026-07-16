import { Button } from "@delulu/design-system/components/ui/button";
import { JsonLd } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { FeatureCard } from "./_components/feature-card";
import { featureJobs, features } from "./features";

const title = "Social Media Management Features";
const description =
  "Explore Delulu features for creating, scheduling, automating, reviewing, and analyzing social content across connected accounts.";

export const metadata: Metadata = createMetadata({
  title,
  description,
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent("Create, schedule, collaborate, automate, and learn")}`
  ),
  alternates: { canonical: getWebUrl("/features") },
  openGraph: { type: "website", url: getWebUrl("/features") },
});

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: getWebUrl() },
    {
      "@type": "ListItem",
      position: 2,
      name: "Features",
      item: getWebUrl("/features"),
    },
  ],
} as const;

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: getWebUrl("/features"),
  isPartOf: { "@type": "WebSite", name: "Delulu Social", url: getWebUrl() },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: features.map((feature, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: feature.title,
      url: getWebUrl(`/features/${feature.slug}`),
    })),
  },
} as const;

export default function FeaturesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl overflow-hidden border-border border-x border-dashed px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <JsonLd code={breadcrumbSchema} />
      <JsonLd code={webPageSchema} />

      <nav
        aria-label="Breadcrumb"
        className="mb-10 flex min-h-11 items-center text-muted-foreground text-sm"
      >
        <Link className="rounded-md px-2 py-3 hover:text-foreground" href="/">
          Home
        </Link>
        <span aria-hidden className="px-1">
          /
        </span>
        <span className="px-2 py-3 text-foreground">Features</span>
      </nav>

      <header className="mx-auto max-w-4xl text-center">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
          Built around the work
        </p>
        <h1 className="mt-4 text-balance font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          <Balancer>
            Plan, publish, and learn without losing the thread
          </Balancer>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg text-muted-foreground leading-8 sm:text-xl">
          Delulu brings content creation, cross-network publishing, scheduling,
          Instagram engagement, team review, and performance reporting into one
          workspace.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="min-h-12 px-6" size="lg">
            <Link href="https://solulu.delulu.social/sign-up">
              Start using Delulu
            </Link>
          </Button>
          <Button asChild className="min-h-12 px-6" size="lg" variant="outline">
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="feature-list-heading" className="mt-20">
        <h2
          className="font-bold text-3xl tracking-tight"
          id="feature-list-heading"
        >
          Choose the job you need to do
        </h2>
        <p className="mt-3 max-w-3xl text-muted-foreground leading-7">
          Every page below covers the real setup, workflow, boundaries, and next
          step—not just a list of claims.
        </p>
        <div className="mt-9 space-y-14">
          {featureJobs.map((job) => {
            const jobFeatures = features.filter(
              (feature) => feature.job === job
            );
            if (jobFeatures.length === 0) {
              return null;
            }
            return (
              <section aria-labelledby={`job-${job.toLowerCase()}`} key={job}>
                <h3
                  className="mb-5 font-semibold text-xl"
                  id={`job-${job.toLowerCase()}`}
                >
                  {job}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {jobFeatures.map((feature) => (
                    <FeatureCard feature={feature} key={feature.slug} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="mt-20 grid gap-8 border-border border-t border-dashed pt-14 lg:grid-cols-2">
        <div>
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
            A practical system
          </p>
          <h2 className="mt-3 font-bold text-3xl tracking-tight">
            The parts share one publishing context
          </h2>
        </div>
        <div className="space-y-4 text-muted-foreground leading-8">
          <p>
            A post can begin as a draft, gain destination-specific content, move
            through review, appear on the calendar, publish through connected
            accounts, and contribute to analytics without being recreated in
            separate tools.
          </p>
          <p>
            Not every network exposes the same formats, controls, automation
            events, or metrics. Each feature page explains those boundaries so
            you can evaluate the workflow before connecting accounts.
          </p>
        </div>
      </section>
    </main>
  );
}
