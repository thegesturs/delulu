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
import { getTool, getToolHref } from "@/lib/tools";
import { textTools } from "./utils/text-tools";

const CATEGORY_PATH = "/tools/text-tools";
const familyTools = textTools.flatMap((definition) => {
  const tool = getTool(definition.slug);
  return tool ? [tool] : [];
});

export const metadata: Metadata = createMetadata({
  title: "Caption & Text for Social Media – Counters & Formatters",
  description:
    "Check caption limits for Instagram, LinkedIn, YouTube, Facebook, and TikTok. Count words and hashtags or format copy-ready social text.",
  keywords: [
    "caption character counter",
    "social post character counter",
    "caption formatter",
    "word and hashtag counter",
  ],
  image: getWebUrl(
    "/api/og?title=Caption%20%26%20Text&description=Check%20caption%20limits%2C%20count%20words%2C%20and%20format%20social%20text"
  ),
  alternates: { canonical: getWebUrl(CATEGORY_PATH) },
  openGraph: { url: getWebUrl(CATEGORY_PATH) },
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
      name: "Caption & Text",
      item: getWebUrl(CATEGORY_PATH),
    },
  ],
};

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Caption and text counters and formatters",
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
    question: "Can I use these counters and formatters for free?",
    answer:
      "Yes. Every counter and formatter on this page works without an account or a visible usage limit.",
  },
  {
    question: "Does Delulu save what I paste here?",
    answer:
      "No. Counting and formatting happen in your browser tab, so your draft is not uploaded or stored.",
  },
  {
    question: "Which social fields can I check?",
    answer:
      "You can check Instagram captions and bios, LinkedIn posts, YouTube titles and descriptions, Facebook posts, and TikTok captions.",
  },
  {
    question: "How are emoji counted?",
    answer:
      "A typical emoji counts as one character here. Emoji made from several combined symbols may be counted differently by the app where you publish.",
  },
  {
    question: "Can I count hashtags and mentions separately?",
    answer:
      "Yes. Every counter shows live hashtag and mention totals alongside characters, words, and lines. Open the hashtag counter when tags are your main concern.",
  },
  {
    question: "Do bold and italic generators use real rich-text formatting?",
    answer:
      "They create copyable styled characters because many social editors do not support rich text. Use them sparingly and preview the result before publishing.",
  },
  {
    question: "Can a finished result be moved into Delulu?",
    answer:
      "For post-ready text, Create this post in Delulu copies the result and opens a new post. Paste once to continue editing or scheduling.",
  },
];

export default function TextToolsFamilyPage() {
  return (
    <main className="mx-auto w-full max-w-7xl border-border border-x border-dashed px-4 py-12 sm:py-16">
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
        <span className="text-foreground">Caption &amp; Text</span>
      </nav>

      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
          <Balancer>Write captions and social text that fit</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          Check a platform limit before you post, count words or hashtags, or
          create copy-ready line breaks and styled text. Your draft stays in
          your browser.
        </p>
      </div>

      <section aria-labelledby="all-text-tools">
        <h2
          className="mb-5 font-bold text-2xl tracking-tight"
          id="all-text-tools"
        >
          What do you need to prepare?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {familyTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-3xl">
        <h2>Start with the field you are writing</h2>
        <p>
          Platform limits are not interchangeable: a short profile bio, a video
          title, and a long post each need a different working budget. Start
          with the counter that matches the field you are preparing. Use the
          general character or word counter when no platform has been chosen
          yet, and add line breaks or styling only after the wording is clear.
        </p>
        <h2>Keep the draft private, then move it where it belongs</h2>
        <p>
          Your draft stays in this tab while you count or format it. Post-ready
          text can move into a Delulu post, while bios, titles, and video
          descriptions stay ready to paste into their destination fields.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          Frequently asked questions
        </h2>
        <ToolFaq items={faq} />
      </section>
    </main>
  );
}
