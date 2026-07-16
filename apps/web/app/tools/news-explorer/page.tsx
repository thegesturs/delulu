import {
  type BreadcrumbList,
  type CollectionPage,
  JsonLd,
  type WithContext,
} from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ToolFaq } from "@/components/tools/tool-faq";
import {
  allNewsRoutes,
  NEWS_CATEGORIES,
  NEWS_COUNTRIES,
  NEWS_FAMILY_PATH,
  newsRoutePath,
} from "./utils/config";
import { newsTitle } from "./utils/content";

const TITLE = "Free News Explorer";
const DESCRIPTION =
  "Browse current headlines by country or topic, open the original reporting, and turn a story into an attributed social post. Free, with no signup.";

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: getWebUrl(NEWS_FAMILY_PATH) },
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent(TITLE)}&description=${encodeURIComponent("Country and topic headline explorers with original publisher links")}`
  ),
  openGraph: {
    url: getWebUrl(NEWS_FAMILY_PATH),
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
});

const faq = [
  {
    question: "What news can I browse here?",
    answer:
      "Start with the latest headlines, choose one of 52 country editions, browse seven major topics, or combine a country and topic for a more focused feed.",
  },
  {
    question: "Can I browse headlines without signing up?",
    answer:
      "Yes. Available cached headlines are visible without an account, blur, subscription screen, or daily cap.",
  },
  {
    question: "Which news topics can I explore?",
    answer:
      "Business, technology, entertainment, sports, science, health, and world news are available globally and for every supported country edition.",
  },
  {
    question: "Does Delulu write or republish these articles?",
    answer:
      "No. News Explorer shows headline-level feed details and short feed-provided excerpts only. Publisher names link to their websites, and Open source takes you to the full report.",
  },
  {
    question: "How often do the headlines refresh?",
    answer:
      "A feed is fresh for 15 minutes. If the source is slow or unavailable, the latest saved headlines stay visible and older results are clearly labeled.",
  },
  {
    question: "Why don't all country and topic pages appear in search?",
    answer:
      "Every combination is available from this page. Search visibility is limited to pages with enough useful, current coverage so thin or empty pages are not promoted.",
  },
  {
    question: "Can I turn a headline into a social post?",
    answer:
      "Yes. Choose Create this post in Delulu to open an editable draft with the headline, publisher attribution, and source link. Read the source and add your own context before publishing.",
  },
  {
    question: "Can the headline source change in the future?",
    answer:
      "Yes. The current public aggregation feed can be replaced by a licensed feed or direct publisher feeds while the country and topic pages continue to work the same way.",
  },
];

export default function NewsExplorerPage() {
  const url = getWebUrl(NEWS_FAMILY_PATH);
  const collectionSchema: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESCRIPTION,
    url,
    isPartOf: getWebUrl("/tools"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: 424,
      itemListElement: allNewsRoutes().map((route, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: newsTitle(route),
        url: getWebUrl(newsRoutePath(route)),
      })),
    },
  };
  const breadcrumbSchema: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: getWebUrl("/tools"),
      },
      { "@type": "ListItem", position: 2, name: "News Explorer", item: url },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-5xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={collectionSchema} />
      <JsonLd code={breadcrumbSchema} />
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-muted-foreground text-sm"
      >
        <Link className="hover:text-foreground" href="/tools">
          Tools
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">News Explorer</span>
      </nav>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
          <Balancer>{TITLE}</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>{DESCRIPTION}</Balancer>
        </p>
        <Link
          className="mt-7 inline-flex rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground"
          href={newsRoutePath({})}
        >
          Browse latest headlines
        </Link>
      </div>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-bold text-2xl tracking-tight">Browse by topic</h2>
        <p className="mt-2 text-muted-foreground">
          Start broad, then combine any topic with a country edition below.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {NEWS_CATEGORIES.map((category) => (
            <Link
              className="rounded-lg border p-4 hover:border-primary"
              href={newsRoutePath({ category })}
              key={category.slug}
            >
              <span className="font-semibold">{category.name} news</span>
              <span className="mt-1 block text-muted-foreground text-sm">
                {category.context}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-bold text-2xl tracking-tight">
          Browse all 52 country editions
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {NEWS_COUNTRIES.map((country) => (
            <Link
              className="rounded-md border px-3 py-2 text-sm hover:border-primary"
              href={newsRoutePath({ country })}
              key={country.slug}
            >
              {country.name} news
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-bold text-2xl tracking-tight">
          Every country and topic combination
        </h2>
        <p className="mt-2 text-muted-foreground">
          Open a country below to find its business, technology, entertainment,
          sports, science, health, and world headlines.
        </p>
        <div className="mt-5 space-y-2">
          {NEWS_COUNTRIES.map((country) => (
            <details className="rounded-lg border px-4 py-3" key={country.slug}>
              <summary className="cursor-pointer font-medium">
                {country.name} topic explorers
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {NEWS_CATEGORIES.map((category) => (
                  <Link
                    className="rounded-full border px-3 py-1 text-sm hover:border-primary"
                    href={newsRoutePath({ country, category })}
                    key={category.slug}
                  >
                    {country.name} {category.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-2xl">
        <h2>Headline research with publisher context intact</h2>
        <p>
          News Explorer is built for quick discovery, not article replacement.
          Publisher names, timestamps, and source links stay visible so a
          headline can lead back to its reporting. Saved headline feeds keep the
          page fast without requesting the source again for every visit.
        </p>
        <p>
          Country editions help localize the feed, while topic editions narrow
          it by subject. Combine both when you need a focused view, such as
          India technology news or United Kingdom business news.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          Frequently asked questions
        </h2>
        <ToolFaq items={faq} />
      </section>
    </main>
  );
}
