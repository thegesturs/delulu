import {
  type BreadcrumbList,
  JsonLd,
  type WebApplication,
  type WithContext,
} from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import Balancer from "react-wrap-balancer";
import { ToolFaq } from "@/components/tools/tool-faq";
import {
  isIndexableNewsRoute,
  NEWS_CATEGORIES,
  NEWS_COUNTRIES,
  NEWS_FAMILY_PATH,
  type NewsRoute,
  newsRoutePath,
  parseNewsToolSlug,
} from "../utils/config";
import {
  newsDescription,
  newsFaq,
  newsIntro,
  newsShortTitle,
  newsTitle,
} from "../utils/content";
import { NewsExplorer } from "../utils/news-explorer";
import { getNewsForRequest } from "../utils/service";

export const revalidate = 900;

const getRequestNews = cache(getNewsForRequest);

interface PageProps {
  params: Promise<{ specificTool: string }>;
}

const routeFromParams = async (
  params: PageProps["params"]
): Promise<NewsRoute | null> => parseNewsToolSlug((await params).specificTool);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const route = await routeFromParams(params);
  if (!route) {
    return {};
  }
  const title = newsTitle(route);
  const description = newsDescription(route);
  const canonical = getWebUrl(newsRoutePath(route));
  const result = await getRequestNews(route);
  const indexable = isIndexableNewsRoute(route) && result.items.length > 0;
  return createMetadata({
    title,
    description,
    keywords: [
      newsTitle(route).toLowerCase(),
      route.country
        ? `${route.country.name.toLowerCase()} news content ideas`
        : "news content ideas for social media",
      route.category
        ? `${route.category.name.toLowerCase()} content ideas for social media`
        : "news stories to share on social media",
      `${newsShortTitle(route).toLowerCase()} headlines`,
    ],
    image: getWebUrl(
      `/api/og?title=${encodeURIComponent(newsTitle(route))}&description=${encodeURIComponent("Fresh headlines with clear publisher attribution")}`
    ),
    alternates: { canonical },
    robots: indexable
      ? undefined
      : {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        },
    openGraph: { url: canonical, title, description, type: "website" },
  });
}

const relatedRoutes = (route: NewsRoute): NewsRoute[] => {
  if (route.country) {
    return NEWS_CATEGORIES.slice(0, 7).map((category) => ({
      country: route.country,
      category,
    }));
  }
  if (route.category) {
    return NEWS_COUNTRIES.slice(0, 8).map((country) => ({
      country,
      category: route.category,
    }));
  }
  return NEWS_CATEGORIES.map((category) => ({ category }));
};

export default async function NewsPage({ params }: PageProps) {
  const route = await routeFromParams(params);
  if (!route) {
    notFound();
  }
  const result = await getRequestNews(route);
  const title = newsTitle(route);
  const shortTitle = newsShortTitle(route);
  const displayTitle = route.country
    ? `${route.country.emoji} ${title}`
    : title;
  const description = newsDescription(route);
  const url = getWebUrl(newsRoutePath(route));
  const faq = newsFaq(route);
  const intro = newsIntro(route);
  const softwareSchema: WithContext<WebApplication> = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description,
    url,
    applicationCategory: "NewsApplication",
    operatingSystem: "Web Browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
      {
        "@type": "ListItem",
        position: 2,
        name: "News Explorer",
        item: getWebUrl(NEWS_FAMILY_PATH),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: url,
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-5xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={softwareSchema} />
      <JsonLd code={breadcrumbSchema} />
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-muted-foreground text-sm"
      >
        <Link className="hover:text-foreground" href="/tools">
          Tools
        </Link>
        <span className="mx-2">/</span>
        <Link className="hover:text-foreground" href={NEWS_FAMILY_PATH}>
          News Content Ideas
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{displayTitle}</span>
      </nav>

      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
          <Balancer>{displayTitle}</Balancer>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-8">
          <Balancer>{description}</Balancer>
        </p>
      </div>

      <NewsExplorer initial={result} />

      {result.items.length > 0 ? (
        <>
          <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-2xl">
            <h2>
              Explore {shortTitle.toLowerCase()} without losing the source
            </h2>
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-5 font-bold text-2xl tracking-tight">
              How to find news-based social media content ideas
            </h2>
            <ol className="space-y-4">
              {[
                [
                  "Choose a view",
                  `Browse all headlines or focus on ${route.country?.name ?? "a country"} and ${route.category?.name.toLowerCase() ?? "a topic"}.`,
                ],
                [
                  "Check the reporting",
                  "Compare the publisher, time, and headline, then use Open source to read the complete article in context.",
                ],
                [
                  "Create an attributed draft",
                  "Choose Create post to open an editable Delulu draft containing the headline, publisher, and original link.",
                ],
              ].map(([name, text], index) => (
                <li className="flex gap-4" key={name}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{name}</h3>
                    <p className="text-muted-foreground text-sm leading-6">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-4 font-bold text-2xl tracking-tight">
              How fresh are these headlines?
            </h2>
            <div className="space-y-3 text-muted-foreground leading-7">
              <p>
                Headlines come from a public aggregation feed. We keep the
                headline, publisher, publication date, source link, and optional
                short feed excerpt or image. Full article text stays with the
                publisher.
              </p>
              <p>
                We check for updates after 15 minutes. If the source is slow or
                unavailable, recent saved headlines stay visible while a refresh
                runs. Older results are labeled clearly, and duplicate links or
                near-identical headlines are removed. The public aggregation
                source is not presented as an official supported commercial API.
              </p>
            </div>
          </section>

          <section className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-4 font-bold text-2xl tracking-tight">
              More news content ideas
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedRoutes(route).map((related) => (
                <Link
                  className="rounded-full border px-3 py-1.5 text-sm hover:border-primary"
                  href={newsRoutePath(related)}
                  key={newsRoutePath(related)}
                >
                  {related.country ? `${related.country.emoji} ` : ""}
                  {newsShortTitle(related)}
                </Link>
              ))}
            </div>
          </section>

          <section className="mx-auto mt-16 max-w-2xl">
            <h2 className="mb-4 font-bold text-2xl tracking-tight">
              Frequently asked questions
            </h2>
            <ToolFaq items={faq} />
          </section>
        </>
      ) : null}
    </main>
  );
}
