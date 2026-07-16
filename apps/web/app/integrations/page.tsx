import { Button } from "@delulu/design-system/components/ui/button";
import { JsonLd } from "@delulu/seo/json-ld";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { IntegrationBreadcrumbs } from "./_components/integration-breadcrumbs";
import { IntegrationCard } from "./_components/integration-card";
import {
  availabilityLabels,
  featureLinks,
  integrationPages,
  integrationWorkflows,
  workflowDescriptions,
} from "./_lib/integration-pages";
import {
  createIntegrationBreadcrumbSchema,
  createIntegrationsMetadata,
  createIntegrationsWebPageSchema,
} from "./_lib/integration-seo";

const DEFAULT_APP_ORIGIN = "https://solulu.delulu.social";

const connectedAccountsUrl = new URL(
  "/socials",
  process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_ORIGIN
).href;

export const metadata = createIntegrationsMetadata();

const indexQuestions = [
  {
    question: "Which social platforms does Delulu currently implement?",
    answer:
      "Delulu's connection and publisher registries implement Instagram, Facebook, LinkedIn, TikTok, YouTube, Threads, X, Pinterest, Bluesky, and Farcaster. Self-serve availability differs, so each detail page states whether the connection is broadly visible, feature-gated, or limited-access.",
  },
  {
    question: "Can one campaign use different copy for every platform?",
    answer:
      "Yes. Keep shared campaign timing and source material, then create a platform-specific version for each selected account. This is how a long LinkedIn explanation and a concise conversational post can stay coordinated without becoming identical.",
  },
  {
    question: "Does every listed integration appear in Connected Accounts?",
    answer:
      "No. Seven are present in the current self-serve account dialog, X can be hidden by a workspace feature flag, and Pinterest, Bluesky, and Farcaster are not broadly exposed there. Their pages explain the current access boundary before setup guidance.",
  },
  {
    question: "Should I test a connection before scheduling a full campaign?",
    answer:
      "Yes. Provider permissions, account eligibility, token health, media processing, and destination choices can change outside Delulu. Connect the real account and publish a representative test before committing a campaign calendar.",
  },
] as const;

export default function IntegrationsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl overflow-hidden border-x">
      <JsonLd code={createIntegrationBreadcrumbSchema()} />
      <JsonLd code={createIntegrationsWebPageSchema()} />

      <section className="border-b px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <IntegrationBreadcrumbs />
        <div className="mt-8 max-w-4xl">
          <p className="font-semibold text-primary text-sm">
            Publishing destinations
          </p>
          <h1 className="mt-3 text-balance font-semibold text-4xl tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Choose the right integration for each part of your campaign
          </h1>
          <p className="mt-5 max-w-3xl text-balance text-lg text-muted-foreground leading-8 sm:text-xl">
            Delulu coordinates the calendar without pretending every network is
            the same. Compare the formats, setup, availability, and limits for
            every implemented publishing destination.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="min-h-11 w-full sm:w-auto" size="lg">
              <Link href="#all-integrations">
                Compare all integrations
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="min-h-11 w-full sm:w-auto"
              size="lg"
              variant="outline"
            >
              <Link href={connectedAccountsUrl}>
                Open Connected Accounts
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-3xl">
          <p className="font-semibold text-primary text-sm">
            Choose by workflow
          </p>
          <h2 className="mt-2 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
            Start with the job the post needs to do
          </h2>
          <p className="mt-3 text-muted-foreground leading-7">
            One integration can serve more than one workflow. Use these groups
            to narrow the choice, then check the detail page before connecting.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {integrationWorkflows.map((workflow) => {
            const integrations = integrationPages.filter((integration) =>
              (integration.workflows as readonly string[]).includes(workflow)
            );
            return (
              <article
                className="rounded-2xl border bg-card p-5 sm:p-6"
                key={workflow}
              >
                <h3 className="font-semibold text-xl">{workflow}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-6">
                  {workflowDescriptions[workflow]}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {integrations.map((integration) => (
                    <Link
                      className="inline-flex min-h-11 items-center rounded-full border bg-background px-4 font-medium text-sm hover:bg-muted"
                      href={`/integrations/${integration.slug}`}
                      key={integration.slug}
                    >
                      {integration.name}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="scroll-mt-24 border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12"
        id="all-integrations"
      >
        <div className="max-w-3xl">
          <p className="font-semibold text-primary text-sm">All integrations</p>
          <h2 className="mt-2 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
            Every implemented publishing destination
          </h2>
          <p className="mt-3 text-muted-foreground leading-7">
            Availability labels reflect the current account connection surface,
            not just whether provider code exists in the backend.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrationPages.map((integration) => (
            <IntegrationCard integration={integration} key={integration.slug} />
          ))}
        </div>
        <div className="mt-8 grid gap-3 rounded-2xl bg-muted/60 p-5 sm:grid-cols-3 sm:p-6">
          {Object.entries(availabilityLabels).map(([availability, label]) => (
            <div key={availability}>
              <p className="font-medium text-sm">{label}</p>
              <p className="mt-1 text-muted-foreground text-xs leading-5">
                {availability === "self-serve" &&
                  "Shown in the standard Connected Accounts dialog."}
                {availability === "feature-gated" &&
                  "Implemented, but the workspace may need access enabled."}
                {availability === "limited-access" &&
                  "Implemented, but not broadly exposed through self-serve setup."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-3xl">
          <p className="font-semibold text-primary text-sm">
            Beyond the connection
          </p>
          <h2 className="mt-2 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
            Put integrations into a complete publishing workflow
          </h2>
          <p className="mt-3 text-muted-foreground leading-7">
            A connected account becomes useful when the calendar, review, and
            publishing process around it are clear.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureLinks.map((feature) => (
            <Link
              className="group min-w-0 rounded-2xl border p-5 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/features/${feature.slug}`}
              key={feature.slug}
            >
              <h3 className="flex items-center justify-between gap-3 font-semibold">
                <span className="min-w-0 break-words">{feature.name}</span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-3xl">
          <p className="font-semibold text-primary text-sm">
            Before you connect
          </p>
          <h2 className="mt-2 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
            Integration questions worth answering early
          </h2>
        </div>
        <div className="mt-8 divide-y rounded-2xl border bg-card px-4 sm:px-6">
          {indexQuestions.map((item) => (
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

      <section className="px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="rounded-3xl bg-foreground px-5 py-10 text-background sm:px-10 sm:py-12">
          <p className="font-semibold text-background/65 text-sm">
            Start with one real account
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Connect, publish a representative test, then build the calendar.
          </h2>
          <p className="mt-4 max-w-2xl text-background/70 leading-7">
            That small test confirms the provider permissions, destination,
            format, and account eligibility that matter for your campaign.
          </p>
          <Button
            asChild
            className="mt-7 min-h-11 w-full bg-background text-foreground hover:bg-background/90 sm:w-auto"
            size="lg"
          >
            <Link href={connectedAccountsUrl}>
              Open Connected Accounts
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
