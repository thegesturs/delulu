"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import { ArrowRight, Github } from "lucide-react";
import { useState } from "react";
import { LANDING_LINKS } from "@/lib/landing-links";
import { AgentWorkflowGraphic } from "./agent-workflow-graphic";
import { ProductPreview } from "./product-preview";
import { TrackedLandingLink } from "./tracked-landing-link";

const previewTabs = [
  { label: "Composer", crop: "composer" as const },
  { label: "Scheduling", crop: "schedule" as const },
  { label: "Approvals", crop: "full" as const },
] as const;

export function Hero() {
  const [activePreview, setActivePreview] = useState(0);

  return (
    <section className="landing-grid overflow-hidden" id="home">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-20 pb-14 md:px-6 md:pt-28 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:pb-20">
        <div className="max-w-2xl">
          <div className="mb-7 flex w-fit items-center gap-2 rounded-full bg-background px-3 py-2 text-sm shadow-sm ring-1 ring-foreground/10">
            <span className="size-2 rounded-full bg-primary" />
            Open-source scheduling for AI agents
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              AGPL
            </span>
          </div>

          <h1 className="font-semibold text-5xl leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[4.75rem]">
            Your agent can run{" "}
            <span className="text-primary">your social media.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-8">
            Give your agent permissioned tools to prepare media, schedule,
            publish, and handle approvals across 10+ social networks. Use MCP,
            the CLI, or the API. Run it hosted or self-host it.
          </p>

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button asChild className="h-12 px-6" size="lg">
              <TrackedLandingLink
                destination="agent_setup"
                href={LANDING_LINKS.agentSetup}
                surface="hero"
              >
                Connect your agent
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </TrackedLandingLink>
            </Button>
            <Button asChild className="h-12 px-6" size="lg" variant="outline">
              <TrackedLandingLink
                destination="source"
                href={LANDING_LINKS.source}
                surface="hero"
              >
                <Github aria-hidden="true" className="mr-2 size-4" />
                View on GitHub
              </TrackedLandingLink>
            </Button>
          </div>

          <p className="mt-5 text-muted-foreground text-sm">
            Hosted when you want it. Self-hosted when you don&apos;t.
          </p>
        </div>

        <div className="min-w-0 lg:-mr-28">
          <ProductPreview
            className="rounded-[1.4rem] lg:rounded-[1.75rem]"
            crop={previewTabs[activePreview]?.crop ?? "full"}
            priority
            sizes="(min-width: 1024px) 56vw, 94vw"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-14 md:px-6 lg:pb-20">
        <p className="mb-4 font-mono font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.22em]">
          One social operating layer
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {previewTabs.map((tab, index) => (
            <button
              aria-pressed={activePreview === index}
              className={cn(
                "min-h-11 touch-manipulation rounded-full px-4 font-medium text-sm outline-none ring-1 ring-foreground/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                activePreview === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              key={tab.label}
              onClick={() => setActivePreview(index)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {previewTabs[activePreview]?.label} product preview selected.
        </p>
        <div className="mt-10">
          <AgentWorkflowGraphic />
        </div>
      </div>
    </section>
  );
}
