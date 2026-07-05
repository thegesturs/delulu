import {
  createFAQPageSchema,
  createHowToSchema,
  JsonLd,
  type SoftwareApplication,
  type WithContext,
} from "@delulu/seo/json-ld";
import Link from "next/link";
import type { ReactNode } from "react";
import Balancer from "react-wrap-balancer";
import type { Tool } from "@/lib/tools";
import type { FaqItem } from "./tool-faq";
import { ToolFaq } from "./tool-faq";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social";

interface ToolPageLayoutProps {
  tool: Tool;
  /** The interactive tool (client component). */
  children: ReactNode;
  /** Long-form SEO copy rendered under the tool. */
  seo: ReactNode;
  howToSteps: Array<{ name: string; text: string }>;
  faq: FaqItem[];
}

export function ToolPageLayout({
  tool,
  children,
  seo,
  howToSteps,
  faq,
}: ToolPageLayoutProps) {
  const url = `${WEB_URL}/tools/${tool.slug}`;

  const softwareSchema: WithContext<SoftwareApplication> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
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

  return (
    <main className="mx-auto w-full max-w-5xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={softwareSchema} />
      <JsonLd
        code={createHowToSchema({
          title: tool.title,
          description: tool.description,
          url,
          steps: howToSteps,
        })}
      />
      <JsonLd
        code={createFAQPageSchema({
          title: tool.title,
          url,
          questions: faq,
        })}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-muted-foreground text-sm">
        <Link className="hover:text-foreground" href="/tools">
          Tools
        </Link>
        <span className="mx-2">/</span>
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

      {/* Interactive tool */}
      {children}

      {/* SEO copy */}
      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-2xl">
        {seo}
      </section>

      {/* How it works */}
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-6 font-bold text-2xl tracking-tight">How it works</h2>
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

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          Frequently asked questions
        </h2>
        <ToolFaq items={faq} />
      </section>
    </main>
  );
}
