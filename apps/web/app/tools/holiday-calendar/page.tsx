import {
  type BreadcrumbList,
  type ItemList,
  JsonLd,
  type WithContext,
} from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolFaq } from "@/components/tools/tool-faq";
import { getToolFamily, getToolHref, tools } from "@/lib/tools";

const family = getToolFamily("holiday-calendar")!;
const familyTools = tools.filter(
  (tool) => tool.family?.slug === family.slug && tool.status !== "coming-soon"
);

const description =
  "Plan timely social posts with reliable global, U.S., India, awareness-day, and seasonal calendars. Search dates and start creating for free.";

export const metadata: Metadata = createMetadata({
  title: "Free Social Media Calendars for Content Planning",
  description,
  keywords: [
    "social media holiday calendar",
    "social media content calendar",
    "awareness days calendar",
  ],
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent("Social Media Calendars")}&description=${encodeURIComponent("Find reliable dates for your next post")}`
  ),
  alternates: {
    canonical: getWebUrl("/tools/holiday-calendar"),
  },
  openGraph: {
    type: "website",
    url: getWebUrl("/tools/holiday-calendar"),
  },
});

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
      name: family.title,
      item: getWebUrl("/tools/holiday-calendar"),
    },
  ],
};

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: family.title,
  description,
  itemListElement: familyTools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.description,
    url: getWebUrl(getToolHref(tool)),
  })),
};

const faq = [
  {
    question: "Which social media calendar should I choose?",
    answer:
      "Start with the general calendar if you are exploring. Choose a country calendar for a local audience, awareness days for cause-led planning, or the seasonal calendar for recurring campaigns.",
  },
  {
    question: "Which countries are covered?",
    answer:
      "The current calendar includes carefully sourced national dates for the United States and India, plus global observances that remain useful in both views.",
  },
  {
    question: "Can I plan posts without creating an account?",
    answer:
      "Yes. Search, filters, date calculations, copy, and sharing work without signup or visible usage limits.",
  },
  {
    question: "How are the dates checked?",
    answer:
      "Dates come from established international and government sources. Fixed dates stay fixed, while weekday holidays are recalculated for each year.",
  },
  {
    question: "Why aren't hundreds of novelty days included?",
    answer:
      "A shorter, reviewable calendar is more trustworthy than a giant list of dates with unclear origins. New dates are added only when the source and audience scope are defensible.",
  },
  {
    question: "Are movable religious and regional holidays included?",
    answer:
      "Not by default. Dates that require an authoritative annual calendar are omitted rather than guessed or incorrectly repeated across years.",
  },
  {
    question: "Can I turn a calendar date into a social post?",
    answer:
      "Yes. Choose a date and select Create this post in Delulu to open the composer with the occasion, date, and a starting angle ready to edit and preview.",
  },
];

export default function HolidayCalendarPage() {
  return (
    <main className="mx-auto w-full max-w-5xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={breadcrumbSchema} />
      <JsonLd code={itemListSchema} />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-muted-foreground text-sm"
      >
        <Link className="hover:text-foreground" href="/tools">
          Tools
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{family.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
          <Balancer>
            Plan your social calendar with dates you can trust
          </Balancer>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-8">
          <Balancer>
            Pick the calendar that matches your audience, find a relevant date,
            and turn it into a post idea you can actually use.
          </Balancer>
        </p>
      </div>

      <section aria-labelledby="calendar-list-heading" className="mt-12">
        <h2
          className="mb-3 font-bold text-2xl tracking-tight"
          id="calendar-list-heading"
        >
          Choose a calendar
        </h2>
        <p className="mb-6 max-w-3xl text-muted-foreground leading-7">
          Start broad, focus on a country, or browse awareness and seasonal
          dates. Each calendar is free and works without signup.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {familyTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-3xl">
        <h2>Reliable dates without the novelty-day clutter</h2>
        <p>
          A giant list is not automatically a useful content calendar. These
          calendars focus on high-confidence global observances and selected
          national dates that creators, social-media managers, and marketers can
          plan around with confidence. Search and filtering stay in the browser.
        </p>
        <p>
          Weekday-based holidays such as the fourth Thursday in November are
          recalculated for the chosen year. Fixed dates remain fixed. Each
          result labels that distinction, and the calendar keeps a maintained
          source list.
        </p>

        <h2>Pick the view that matches the audience</h2>
        <ul>
          <li>
            Use the general calendar to explore across all available scopes.
          </li>
          <li>Use a country view when national context matters.</li>
          <li>Use awareness days for sourced public-interest observances.</li>
          <li>Use the seasonal view to plan recurring creative moments.</li>
        </ul>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          Holiday calendar questions
        </h2>
        <ToolFaq items={faq} />
      </section>
    </main>
  );
}
