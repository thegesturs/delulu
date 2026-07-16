import {
  type BreadcrumbList,
  createHowToSchema,
  JsonLd,
  type WebApplication,
  type WithContext,
} from "@delulu/seo/json-ld";
import { getWebUrl } from "@delulu/seo/url";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Balancer from "react-wrap-balancer";
import { type Tool, tools } from "@/lib/tools";
import type { FaqItem } from "./tool-faq";
import { ToolFaq } from "./tool-faq";

/** An extra H2 content block rendered below the tool (e.g. "Why use…"). */
export interface ToolSection {
  heading: string;
  body: ReactNode;
}

interface ToolPageLayoutProps {
  tool: Tool;
  /** The interactive tool (client component). */
  children: ReactNode;
  /** Short intro copy rendered directly under the tool (keyword-rich). */
  seo: ReactNode;
  /** Heading for the how-to list. Keyword-rich per tool. */
  howToHeading: string;
  howToSteps: Array<{ name: string; text: string }>;
  /** Additional H2 content blocks (why use, formats, privacy, use cases…). */
  sections?: ToolSection[];
  faq: FaqItem[];
  relatedSlugs?: string[];
  relatedHeading?: string;
}

export function ToolPageLayout({
  tool,
  children,
  seo,
  howToHeading,
  howToSteps,
  sections = [],
  faq,
  relatedSlugs,
  relatedHeading = "Try another creator task",
}: ToolPageLayoutProps) {
  const url = getWebUrl(tool.href);

  const softwareSchema: WithContext<WebApplication> = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    isAccessibleForFree: true,
  };

  const breadcrumbSchema: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Free creator tools",
        item: getWebUrl("/tools"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.family?.title ?? tool.title,
        item: tool.family ? getWebUrl(tool.family.href) : url,
      },
      ...(tool.family
        ? [
            {
              "@type": "ListItem" as const,
              position: 3,
              name: tool.title,
              item: url,
            },
          ]
        : []),
    ],
  };

  // Related tools = same category, live, excluding this one. Powers internal
  // linking + the "More free tools" block the SEO playbook recommends.
  const related = tools.filter(
    (candidate) =>
      candidate.slug !== tool.slug &&
      candidate.status !== "coming-soon" &&
      (!relatedSlugs || relatedSlugs.includes(candidate.slug))
  );

  return (
    <main className="mx-auto w-full max-w-5xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={softwareSchema} />
      <JsonLd code={breadcrumbSchema} />
      <JsonLd
        code={createHowToSchema({
          title: howToHeading,
          description: tool.description,
          url,
          steps: howToSteps,
        })}
      />
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-muted-foreground text-sm"
      >
        <Link className="hover:text-foreground" href="/tools">
          Free creator tools
        </Link>
        <span className="mx-2">/</span>
        {tool.family && (
          <>
            <Link className="hover:text-foreground" href={tool.family.href}>
              {tool.family.title}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-foreground">{tool.title}</span>
      </nav>

      {/* Hero */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          <Balancer>{tool.title}</Balancer>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-8">
          <Balancer>{tool.description}</Balancer>
        </p>
      </div>

      {/* Interactive tool — above the fold, before the SEO copy */}
      {children}

      {/* Intro copy */}
      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-2xl">
        {seo}
      </section>

      {/* How to */}
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-6 font-bold text-2xl tracking-tight">
          {howToHeading}
        </h2>
        <ol className="space-y-4">
          {howToSteps.map((step, idx) => (
            <li className="flex gap-4" key={step.name}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                {idx + 1}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{step.name}</h3>
                <p className="text-muted-foreground text-sm leading-6">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Extra content blocks (why use, formats, privacy…) */}
      {sections.map((section) => (
        <section className="mx-auto mt-16 max-w-2xl" key={section.heading}>
          <h2 className="mb-4 font-bold text-2xl tracking-tight">
            {section.heading}
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
            {section.body}
          </div>
        </section>
      ))}

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          Frequently asked questions
        </h2>
        <ToolFaq items={faq} />
      </section>

      {/* Related / more tools — internal linking */}
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          {relatedHeading}
        </h2>
        {related.length > 0 ? (
          <ul className="space-y-2">
            {related.map((t) => (
              <li key={t.slug}>
                <Link className="text-primary hover:underline" href={t.href}>
                  {t.title}
                </Link>{" "}
                <span className="text-muted-foreground text-sm">
                  — {t.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            More ways to prepare a post are on the way.{" "}
            <Link className="text-primary hover:underline" href="/tools">
              Choose another task
            </Link>{" "}
            to see what's new.
          </p>
        )}
        <Link
          className="mt-6 inline-flex items-center gap-1.5 font-medium text-primary text-sm hover:underline"
          href="/tools"
        >
          See every creator task <ArrowRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}
