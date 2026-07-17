import { Button } from "@delulu/design-system/components/ui/button";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import { socialBackgroundColors } from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import { JsonLd } from "@delulu/seo/json-ld";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { IntegrationPageDefinition } from "../_lib/integration-pages";
import {
  availabilityLabels,
  getIntegrationPage,
  getRelatedFeatures,
  type IntegrationSlug,
} from "../_lib/integration-pages";
import {
  createIntegrationBreadcrumbSchema,
  createIntegrationSoftwareSchema,
  createIntegrationWebPageSchema,
} from "../_lib/integration-seo";
import { IntegrationBreadcrumbs } from "./integration-breadcrumbs";
import { IntegrationCard } from "./integration-card";

const DEFAULT_APP_ORIGIN = "https://solulu.delulu.social";

const getConnectedAccountsUrl = () =>
  new URL("/socials", process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_ORIGIN)
    .href;

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-semibold text-primary text-sm">{eyebrow}</p>
      <h2 className="mt-2 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-muted-foreground leading-7">{description}</p>
      )}
    </div>
  );
}

export function IntegrationDetailPage({
  integration,
}: {
  integration: IntegrationPageDefinition;
}) {
  const relatedIntegrations = integration.related
    .map((slug) => getIntegrationPage(slug))
    .filter((item): item is IntegrationPageDefinition => Boolean(item));
  const relatedFeatures = getRelatedFeatures(
    integration.slug as IntegrationSlug
  );

  return (
    <main className="mx-auto w-full max-w-7xl overflow-hidden border-x">
      <JsonLd code={createIntegrationBreadcrumbSchema(integration)} />
      <JsonLd code={createIntegrationWebPageSchema(integration)} />
      <JsonLd code={createIntegrationSoftwareSchema(integration)} />

      <section className="border-b px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <IntegrationBreadcrumbs current={integration.name} />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                  socialBackgroundColors[integration.platform]
                )}
              >
                <SocialIcon
                  className="size-6 text-white"
                  size="xl"
                  type={integration.platform}
                />
              </span>
              <span className="rounded-full border bg-card px-3 py-1.5 text-muted-foreground text-sm">
                {availabilityLabels[integration.availability]}
              </span>
            </div>
            <p className="mt-7 font-semibold text-primary text-sm">
              {integration.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl text-balance break-words font-semibold text-4xl tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              {integration.title}
            </h1>
            <p className="mt-5 max-w-3xl text-balance text-lg text-muted-foreground leading-8 sm:text-xl">
              {integration.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href={getConnectedAccountsUrl()}>
                  Check connection availability
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="w-full sm:w-auto"
                size="lg"
                variant="outline"
              >
                <Link href="/integrations">
                  Compare integrations
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <aside className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-semibold text-lg">At a glance</h2>
            <dl className="mt-4 divide-y">
              {integration.highlights.map((item) => (
                <div
                  className="grid gap-1 py-3 first:pt-0 last:pb-0"
                  key={item.label}
                >
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    {item.label}
                  </dt>
                  <dd className="break-words font-medium text-sm leading-6">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid gap-6 text-base leading-8 md:grid-cols-2 md:gap-10">
          {integration.summary.map((paragraph) => (
            <p className="text-foreground/85" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <SectionIntro
          description={`The supported ${integration.name} publishing shapes come from Delulu's current provider rules and publishing path.`}
          eyebrow="Supported publishing"
          title={`What you can publish to ${integration.name}`}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {integration.formats.map((format) => (
            <article
              className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6"
              key={format.title}
            >
              <CheckCircle2 className="size-5 text-primary" />
              <h3 className="mt-5 font-semibold text-lg">{format.title}</h3>
              <p className="mt-2 break-words text-muted-foreground text-sm leading-6">
                {format.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <SectionIntro
          eyebrow="Connection and setup"
          title={`How to set up ${integration.name} in Delulu`}
        />
        <ol className="mt-8 grid gap-4 lg:grid-cols-3">
          {integration.setup.map((step, index) => (
            <li
              className="min-w-0 rounded-2xl border p-5 sm:p-6"
              key={step.title}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-sm">
                {index + 1}
              </span>
              <h3 className="mt-5 font-semibold text-lg">{step.title}</h3>
              <p className="mt-2 break-words text-muted-foreground text-sm leading-6">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionIntro
              eyebrow="Why it helps"
              title={`Why creators and teams use Delulu for ${integration.name}`}
            />
            <div className="mt-7 space-y-6">
              {integration.reasons.map((reason) => (
                <article key={reason.title}>
                  <h3 className="font-semibold text-lg">{reason.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-7">
                    {reason.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <SectionIntro
              eyebrow="Campaign ideas"
              title={`Practical ${integration.name} workflows`}
            />
            <div className="mt-7 space-y-4">
              {integration.examples.map((example) => (
                <article
                  className="rounded-2xl bg-muted/60 p-5 sm:p-6"
                  key={example.title}
                >
                  <h3 className="font-semibold">{example.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-6">
                    {example.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <h2 className="font-semibold text-2xl tracking-tight">
                Limits to know before you schedule
              </h2>
              <ul className="mt-5 space-y-3">
                {integration.limitations.map((limitation) => (
                  <li
                    className="flex items-start gap-3 text-sm leading-6"
                    key={limitation}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-600 dark:bg-amber-400"
                    />
                    <span className="min-w-0 break-words">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <SectionIntro
          eyebrow="Questions before connecting"
          title={`${integration.name} and Delulu: common questions`}
        />
        <div className="mt-8 divide-y rounded-2xl border bg-card px-4 sm:px-6">
          {integration.questions.map((item) => (
            <details className="group" key={item.question}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium marker:hidden">
                <span className="min-w-0 break-words">{item.question}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-3xl pb-5 text-muted-foreground text-sm leading-7">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <SectionIntro
          eyebrow="Connected workflows"
          title={`Use ${integration.name} with the rest of Delulu`}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedFeatures.map((feature) => (
            <Link
              className="group min-w-0 rounded-2xl border p-5 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/features/${feature.slug}`}
              key={feature.slug}
            >
              <h3 className="flex items-center justify-between gap-3 font-semibold">
                <span className="min-w-0 break-words">{feature.title}</span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                {feature.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <SectionIntro
          eyebrow="Related integrations"
          title="Build the rest of the campaign"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {relatedIntegrations.map((item) => (
            <IntegrationCard integration={item} key={item.slug} />
          ))}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="rounded-3xl bg-foreground px-5 py-10 text-background sm:px-10 sm:py-12">
          <p className="font-semibold text-background/65 text-sm">
            Ready to test the workflow?
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Connect {integration.name}, prepare one real post, and review the
            result before scaling the calendar.
          </h2>
          <p className="mt-4 max-w-2xl text-background/70 leading-7">
            Connection availability and provider permissions can vary. Start
            with Connected Accounts, then use a representative draft to verify
            the exact destination and format.
          </p>
          <Button
            asChild
            className="mt-7 w-full bg-background text-foreground hover:bg-background/90 sm:w-auto"
            size="lg"
          >
            <Link href={getConnectedAccountsUrl()}>
              Open Connected Accounts
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
