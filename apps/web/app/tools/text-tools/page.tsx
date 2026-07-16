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

const FAMILY_PATH = "/tools/text-tools";
const familyTools = textTools.flatMap((definition) => {
  const tool = getTool(definition.slug);
  return tool ? [tool] : [];
});

export const metadata: Metadata = createMetadata({
  title: "Free Social Media Text Tools & Character Counters",
  description:
    "Free private text tools for Instagram, LinkedIn, YouTube, Facebook, TikTok, and more. Count characters, words, and hashtags or format copy-ready text.",
  keywords: [
    "social media text tools",
    "character counters",
    "caption tools",
    "word and hashtag counter",
  ],
  image: getWebUrl(
    "/api/og?title=Free%20Social%20Media%20Text%20Tools&description=Character%20counters%2C%20formatters%2C%20and%20caption%20utilities"
  ),
  alternates: { canonical: getWebUrl(FAMILY_PATH) },
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
      name: "Text tools",
      item: getWebUrl(FAMILY_PATH),
    },
  ],
};

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free social media text tools",
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
    question: "Are these social media text tools free?",
    answer:
      "Yes. Every tool in this family is free to use without creating an account, and there is no visible usage limit.",
  },
  {
    question: "Does Delulu save text pasted into these tools?",
    answer:
      "No. Counting and formatting run in your browser tab, so drafts are not uploaded or stored by these tools.",
  },
  {
    question: "Which platform-specific character counters are included?",
    answer:
      "The family includes focused counters for Instagram captions and bios, LinkedIn posts, YouTube titles and descriptions, Facebook posts, and TikTok captions.",
  },
  {
    question: "How are emoji counted?",
    answer:
      "The counters measure Unicode code points, so a typical emoji counts as one character. A destination platform can still apply its own final validation to complex combined emoji.",
  },
  {
    question: "Can I count hashtags and mentions separately?",
    answer:
      "Yes. Every counter shows live hashtag and mention totals alongside characters, words, and lines, and the dedicated hashtag counter provides a focused editing route.",
  },
  {
    question: "Do bold and italic generators use real rich-text formatting?",
    answer:
      "They use copyable Unicode letter variants because many social editors do not support rich text. Use styled text sparingly and preview it before publishing.",
  },
  {
    question: "Can a finished result be moved into Delulu?",
    answer:
      "For post-ready tools, Create post in Delulu copies the result and opens a new post. Paste once in the composer to continue editing or scheduling.",
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
        <span className="text-foreground">Text tools</span>
      </nav>

      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
          <Balancer>Free social media text tools</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          Count platform-specific text before publishing, compare general
          writing stats, or generate copy-ready formatting. Every tool works
          anonymously in your browser and puts the working interface before the
          guidance.
        </p>
      </div>

      <section aria-labelledby="all-text-tools">
        <h2
          className="mb-5 font-bold text-2xl tracking-tight"
          id="all-text-tools"
        >
          All text tools
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {familyTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-3xl">
        <h2>Choose the counter that matches the publishing field</h2>
        <p>
          Platform limits are not interchangeable: a short profile bio, a video
          title, and a long post each need a different working budget. Start
          with the route that matches the field you are preparing. Use the
          general character or word counter when no platform has been chosen
          yet, and use the formatting utilities only after the wording is clear.
        </p>
        <h2>Built for private drafting and practical handoff</h2>
        <p>
          All analysis and transformations happen locally. Post-ready results
          can be copied and moved into the Delulu composer, while bio and
          video-metadata tools stay focused on accurate drafting for their
          destination fields.
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
