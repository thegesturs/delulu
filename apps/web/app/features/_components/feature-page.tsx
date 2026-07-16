import { Button } from "@delulu/design-system/components/ui/button";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import type { Feature } from "../features";
import { featureBySlug } from "../features";
import { FeatureCard } from "./feature-card";

const appUrl = "https://solulu.delulu.social/sign-up";
const integrationPlatforms = {
  instagram: "INSTAGRAM",
  facebook: "FACEBOOK",
  linkedin: "LINKEDIN",
  tiktok: "TIKTOK",
  youtube: "YOUTUBE",
  threads: "THREADS",
} as const;

export function FeaturePage({ feature }: { readonly feature: Feature }) {
  const Icon = feature.icon;
  const related = feature.related.flatMap((slug) => {
    const item = featureBySlug.get(slug);
    return item ? [item] : [];
  });

  return (
    <main className="mx-auto w-full max-w-7xl overflow-hidden border-border border-x border-dashed">
      <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex min-h-11 flex-wrap items-center gap-1 text-muted-foreground text-sm"
        >
          <Link className="rounded-md px-2 py-3 hover:text-foreground" href="/">
            Home
          </Link>
          <ChevronRight aria-hidden className="size-4" />
          <Link
            className="rounded-md px-2 py-3 hover:text-foreground"
            href="/features"
          >
            Features
          </Link>
          <ChevronRight aria-hidden className="size-4" />
          <span className="min-w-0 break-words px-2 py-3 text-foreground">
            {feature.title}
          </span>
        </nav>

        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="min-w-0">
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon
                aria-hidden
                className={`size-6 ${feature.iconClassName ?? ""}`}
              />
            </div>
            <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
              {feature.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-balance font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              {feature.title}
            </h1>
            <p className="mt-6 max-w-3xl text-balance text-lg text-muted-foreground leading-8 sm:text-xl">
              {feature.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="min-h-12 px-6" size="lg">
                <Link href={appUrl}>Start using Delulu</Link>
              </Button>
              <Button
                asChild
                className="min-h-12 px-6"
                size="lg"
                variant="outline"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>

          <aside className="min-w-0 rounded-3xl border border-border bg-muted/40 p-6 sm:p-8">
            <p className="font-semibold text-sm uppercase tracking-[0.16em]">
              The outcome
            </p>
            <p className="mt-4 text-balance font-semibold text-2xl leading-9">
              {feature.outcome}
            </p>
          </aside>
        </section>
      </div>

      <section className="border-border border-y border-dashed bg-muted/20 px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
            How it works
          </p>
          <h2 className="mt-3 font-bold text-3xl tracking-tight">
            From setup to a finished workflow
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {feature.workflow.map((step, index) => (
              <li
                className="rounded-2xl border border-border bg-background p-6"
                key={step.title}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-semibold text-xl">{step.title}</h3>
                <p className="mt-2 text-muted-foreground leading-7">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-2 lg:gap-16">
          <section>
            <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
              Capabilities
            </p>
            <h2 className="mt-3 font-bold text-3xl tracking-tight">
              What you can do
            </h2>
            <ul className="mt-7 space-y-4">
              {feature.capabilities.map((capability) => (
                <li className="flex gap-3 leading-7" key={capability}>
                  <Check
                    aria-hidden
                    className="mt-1 size-5 shrink-0 text-primary"
                  />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
              Best fit
            </p>
            <h2 className="mt-3 font-bold text-3xl tracking-tight">
              Who it is for
            </h2>
            <ul className="mt-7 space-y-3">
              {feature.audience.map((item) => (
                <li
                  className="rounded-xl border border-border px-4 py-3 leading-7"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
            <h3 className="mt-9 font-semibold text-xl">Examples</h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground leading-7 marker:text-primary">
              {feature.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </section>
        </div>

        {feature.sections.map((section) => (
          <section className="mx-auto mt-16 max-w-3xl" key={section.title}>
            <h2 className="font-bold text-3xl tracking-tight">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                className="mt-5 text-lg text-muted-foreground leading-8"
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mx-auto mt-16 max-w-3xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
          <p className="font-semibold text-amber-700 text-sm uppercase tracking-[0.18em] dark:text-amber-300">
            Requirements and limits
          </p>
          <h2 className="mt-3 font-bold text-2xl tracking-tight">
            What to know before you start
          </h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-muted-foreground leading-7 marker:text-amber-600">
            {feature.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
            Questions
          </p>
          <h2 className="mt-3 font-bold text-3xl tracking-tight">
            What people ask about {feature.title.toLowerCase()}
          </h2>
          <div className="mt-7 divide-y divide-border border-border border-y">
            {feature.questions.map((item) => (
              <article className="py-6" key={item.question}>
                <h3 className="font-semibold text-lg leading-7">
                  {item.question}
                </h3>
                <p className="mt-2 text-muted-foreground leading-7">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl">
          <h2 className="font-bold text-3xl tracking-tight">
            Related features
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <FeatureCard feature={item} key={item.slug} />
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-5xl border-border border-t border-dashed pt-10">
          <h2 className="font-bold text-2xl tracking-tight">
            Works with these connected channels
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground leading-7">
            Availability still depends on the post format, account type, and
            permissions described above.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {feature.integrations.map((integration) => (
              <Link
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 font-semibold text-sm transition-colors hover:border-primary/60 hover:text-primary"
                href={`/integrations/${integration.slug}`}
                key={integration.slug}
              >
                <SocialIcon
                  className="mr-2 shrink-0"
                  size="md"
                  type={integrationPlatforms[integration.slug]}
                />
                {integration.name}
              </Link>
            ))}
            <Link
              className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-primary text-sm hover:underline"
              href="/integrations"
            >
              View all integrations
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl rounded-3xl bg-foreground px-6 py-12 text-center text-background sm:px-10">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            <Balancer>
              Put {feature.title.toLowerCase()} into your real workflow
            </Balancer>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-background/75 text-lg leading-8">
            Connect an account, create the first piece of work, and see how
            Delulu fits your publishing process.
          </p>
          <Button
            asChild
            className="mt-7 min-h-12 bg-background px-6 text-foreground hover:bg-background/90"
            size="lg"
          >
            <Link href={appUrl}>Create your account</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
