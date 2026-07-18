import { Button } from "@delulu/design-system/components/ui/button";
import {
  ArrowRight,
  Bot,
  Braces,
  CalendarClock,
  Check,
  CheckCircle2,
  Github,
  KeyRound,
  LockKeyhole,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import Balancer from "react-wrap-balancer";
import { LANDING_LINKS } from "@/lib/landing-links";
import { ProductPreview } from "./product-preview";
import { TrackedLandingLink } from "./tracked-landing-link";

const setupSteps = [
  {
    number: "01",
    title: "Authorize the agent",
    description:
      "Approve one workspace and only the scopes the agent needs. Credentials stay outside the conversation.",
    crop: "composer" as const,
  },
  {
    number: "02",
    title: "Connect your accounts",
    description:
      "Use each network’s official OAuth flow while Delulu encrypts provider credentials.",
    crop: "full" as const,
  },
  {
    number: "03",
    title: "Delegate the calendar",
    description:
      "Ask for a draft, scheduled campaign, or immediate publish and get the real delivery state back.",
    crop: "schedule" as const,
  },
] as const;

const networks = [
  "Instagram",
  "Facebook",
  "X",
  "LinkedIn",
  "TikTok",
  "Pinterest",
  "Threads",
  "YouTube",
  "Bluesky",
  "Farcaster",
] as const;

const capabilities = [
  "Multi-network composer",
  "Scheduled publishing",
  "Reusable media",
  "Content calendar",
  "Post previews",
  "Workspace roles",
  "Approval flows",
  "Target-level status",
  "Safe retries",
  "Idempotent operations",
  "Social analytics",
  "Bulk scheduling",
  "Comment automations",
  "Hosted MCP",
  "Local CLI",
  "Typed REST API",
] as const;

const featureRows = [
  {
    eyebrow: "Publish once, adapt everywhere",
    title: "Turn one idea into a coordinated campaign.",
    description:
      "Prepare the caption and media once, then keep the account, timing, and delivery state for every network visible in one operation.",
    checks: [
      "Draft, schedule, or publish immediately",
      "Reuse uploaded media across targets",
      "Inspect every network result independently",
    ],
    crop: "composer" as const,
  },
  {
    eyebrow: "Control stays human",
    title: "Let agents do the work without giving away the keys.",
    description:
      "Live workspace permissions, delegated scopes, and review requirements are checked when an operation runs, not guessed from an old session.",
    checks: [
      "Revocable agent credentials",
      "Workspace roles and approval gates",
      "Encrypted social-provider tokens",
    ],
    crop: "full" as const,
  },
  {
    eyebrow: "Scheduling you can trust",
    title: "Know what is queued, published, or needs attention.",
    description:
      "Delulu tracks authoritative target states and reuses operation identity during retries so agents can report honest outcomes.",
    checks: [
      "Target-level scheduled and published states",
      "Bounded retries without duplicate posts",
      "Analytics and account health for follow-up",
    ],
    crop: "schedule" as const,
  },
] as const;

export function AgentSections() {
  return (
    <>
      <section className="border-t px-4 py-24 md:px-6 lg:py-32" id="agents">
        <SectionHeading
          description="The browser handles consent. Your agent handles the repetitive operational work before and after it."
          eyebrow="How it works"
          title="One prompt to a scheduled post."
        />

        <div className="mx-auto mt-14 grid max-w-7xl gap-5 lg:grid-cols-3">
          {setupSteps.map((step) => (
            <article
              className="overflow-hidden rounded-3xl bg-card p-3 shadow-sm ring-1 ring-foreground/10"
              key={step.number}
            >
              <ProductPreview
                className="rounded-[1.15rem] shadow-none"
                crop={step.crop}
                label={step.title + " in the Delulu workspace"}
                sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
              />
              <div className="px-3 pt-6 pb-5">
                <p className="font-mono font-semibold text-primary text-xs">
                  {step.number}
                </p>
                <h3 className="mt-3 font-semibold text-xl tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-7">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-20 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-mono font-semibold text-primary text-xs uppercase tracking-[0.2em]">
                Supported networks
              </p>
              <h2 className="mt-4 max-w-xl font-semibold text-3xl tracking-[-0.04em] md:text-5xl">
                Publish where your audience already is.
              </h2>
            </div>
            <p className="max-w-2xl text-lg text-muted-foreground leading-8 lg:justify-self-end">
              One permission model and one publishing state machine across 10+
              social networks, with network-specific settings when they matter.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 overflow-hidden rounded-3xl bg-background ring-1 ring-foreground/10 sm:grid-cols-3 lg:grid-cols-5">
            {networks.map((network) => (
              <div
                className="flex min-h-24 items-center justify-center border-border/70 border-r border-b px-3 text-center font-semibold"
                key={network}
              >
                {network}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t px-4 py-24 md:px-6 lg:py-32" id="product">
        <SectionHeading
          description="Use the surface that fits your agent. Every path reaches the same permissions, reviews, retries, and source of truth."
          eyebrow="Agentic workflows"
          title="Works wherever your agent works."
        />

        <div className="mx-auto mt-14 grid max-w-7xl gap-5 lg:grid-cols-2">
          <WorkflowCard
            description="Connect browser-capable agents through delegated OAuth and structured tools. No pasted API keys."
            icon={<RadioTower aria-hidden="true" className="size-5" />}
            title="Hosted MCP"
          >
            <div className="mt-8 rounded-2xl bg-muted/50 p-4 ring-1 ring-foreground/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bot aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">Agent connection</p>
                    <p className="text-muted-foreground text-xs">
                      posts:write · media:write
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 text-xs">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
            </div>
          </WorkflowCard>

          <WorkflowCard
            description="Local agents get deterministic commands, local-file uploads, machine-readable output, and explicit exit codes."
            icon={<Terminal aria-hidden="true" className="size-5" />}
            title="CLI + agent skill"
          >
            <div className="mt-8 overflow-x-auto rounded-2xl bg-zinc-950 p-5 font-mono text-[13px] text-zinc-200 leading-6">
              <p className="text-zinc-500"># schedule one atomic operation</p>
              <p className="mt-2 whitespace-nowrap">
                <span className="text-violet-400">$</span> delulu post
                &quot;Launch day.&quot; --to linkedin --media launch.mp4 --at
                2026-08-03T09:00:00Z
              </p>
              <div className="mt-3 text-emerald-400">
                <p>Post scheduled</p>
                <p>status: ok</p>
                <p>state: scheduled</p>
                <p>targets: 1</p>
              </div>
            </div>
          </WorkflowCard>

          <WorkflowCard
            description="Create draft-only agents or require a person to approve content before it can publish."
            icon={<ShieldCheck aria-hidden="true" className="size-5" />}
            title="Approval-aware automation"
          >
            <ProductPreview
              className="mt-8 rounded-2xl shadow-none"
              crop="composer"
              label="A Delulu post prepared for review"
              sizes="(min-width: 1024px) 44vw, 92vw"
            />
          </WorkflowCard>

          <WorkflowCard
            description="Build custom workflows on versioned contracts, scoped OAuth, idempotency, and authoritative states."
            icon={<Braces aria-hidden="true" className="size-5" />}
            title="Typed REST API"
          >
            <div className="mt-8 overflow-x-auto rounded-2xl bg-muted/60 p-5 font-mono text-[13px] leading-6 ring-1 ring-foreground/10">
              <p className="text-muted-foreground">
                POST /v1/workspaces/:workspaceId/posts
              </p>
              <p className="mt-2 whitespace-nowrap">
                authorization: Bearer del_••••••••
              </p>
              <p className="mt-3 text-primary">200 · status: scheduled</p>
            </div>
          </WorkflowCard>
        </div>
      </section>

      <section className="border-t px-4 py-24 md:px-6 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="font-mono font-semibold text-primary text-xs uppercase tracking-[0.2em]">
              People stay in control
            </p>
            <h2 className="mt-4 font-semibold text-4xl tracking-[-0.045em] md:text-6xl">
              <Balancer>Built for agents. Controlled by people.</Balancer>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-8">
              Automation removes repetitive work without removing ownership,
              accountability, or a clear recovery path.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ControlCard
              description="Grant revocable, workspace-bound scopes instead of sharing social credentials."
              icon={<KeyRound aria-hidden="true" className="size-5" />}
              title="Delegated access"
            />
            <ControlCard
              description="Every operation checks current membership and role permissions."
              icon={<UsersRound aria-hidden="true" className="size-5" />}
              title="Live workspace roles"
            />
            <ControlCard
              description="Require a person to approve a draft before publishing is allowed."
              icon={<ShieldCheck aria-hidden="true" className="size-5" />}
              title="Human review"
            />
            <ControlCard
              description="Retries reuse operation identity and report partial failures honestly."
              icon={<RefreshCw aria-hidden="true" className="size-5" />}
              title="Reliable outcomes"
            />
            <ControlCard
              description="Provider tokens are encrypted and isolated from agent conversations."
              icon={<LockKeyhole aria-hidden="true" className="size-5" />}
              title="Credential isolation"
            />
            <ControlCard
              description="Agents can inspect the scheduled, pending, published, or failed state."
              icon={<CalendarClock aria-hidden="true" className="size-5" />}
              title="Authoritative states"
            />
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-24 md:px-6 lg:py-32">
        <SectionHeading
          description="Scheduling is the core workflow, backed by the media, approvals, analytics, and operational safeguards agents need."
          eyebrow="The social operating layer"
          title="Everything keeps moving from one place."
        />

        <div className="mx-auto mt-14 grid max-w-7xl gap-px overflow-hidden rounded-3xl bg-border ring-1 ring-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability) => (
            <div
              className="flex min-h-16 items-center gap-3 bg-background px-5 font-medium text-sm"
              key={capability}
            >
              <CheckCircle2
                aria-hidden="true"
                className="size-4 text-primary"
              />
              {capability}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 grid max-w-7xl gap-24 lg:gap-32">
          {featureRows.map((feature, index) => (
            <article
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              key={feature.title}
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <p className="font-mono font-semibold text-primary text-xs uppercase tracking-[0.2em]">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-4 max-w-xl font-semibold text-3xl tracking-[-0.04em] md:text-5xl">
                  {feature.title}
                </h3>
                <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-8">
                  {feature.description}
                </p>
                <ul className="mt-7 grid gap-3">
                  {feature.checks.map((check) => (
                    <li className="flex items-center gap-3" key={check}>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check aria-hidden="true" className="size-3.5" />
                      </span>
                      <span className="font-medium">{check}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 h-11" variant="outline">
                  <TrackedLandingLink
                    destination="docs"
                    href={LANDING_LINKS.docs}
                    surface="product_feature"
                  >
                    Explore the docs
                    <ArrowRight aria-hidden="true" className="ml-2 size-4" />
                  </TrackedLandingLink>
                </Button>
              </div>
              <ProductPreview
                className={index % 2 === 1 ? "lg:order-1" : undefined}
                crop={feature.crop}
                label={feature.title + " shown in Delulu"}
                sizes="(min-width: 1024px) 48vw, 92vw"
              />
            </article>
          ))}
        </div>
      </section>

      <section
        className="border-t px-4 py-24 md:px-6 lg:py-32"
        id="open-source"
      >
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-foreground text-background shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 md:p-12 lg:p-16">
            <div className="flex w-fit items-center gap-2 rounded-full bg-background/10 px-3 py-2 font-medium text-sm">
              <Github aria-hidden="true" className="size-4" />
              AGPL-3.0 open source
            </div>
            <h2 className="mt-7 max-w-2xl font-semibold text-4xl tracking-[-0.05em] md:text-6xl">
              Run the social layer your agents depend on.
            </h2>
            <p className="mt-6 max-w-2xl text-background/70 text-lg leading-8">
              Deploy Delulu with Docker Compose and PostgreSQL, keep your data
              on infrastructure you control, and inspect the full publishing
              path.
            </p>
            <p className="mt-4 max-w-2xl text-background/60 text-sm leading-6">
              The first self-hosted release requires your own Clerk and
              Cloudflare R2 projects.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11" variant="secondary">
                <TrackedLandingLink
                  destination="source"
                  href={LANDING_LINKS.source}
                  surface="open_source"
                >
                  <Github aria-hidden="true" className="mr-2 size-4" />
                  View the source
                </TrackedLandingLink>
              </Button>
              <TrackedLandingLink
                className="flex min-h-11 items-center justify-center rounded-lg px-4 font-medium text-background outline-none ring-1 ring-background/25 transition-colors hover:bg-background/10 focus-visible:ring-2 focus-visible:ring-background"
                destination="self_host_docs"
                href={LANDING_LINKS.docs + "/self-hosting/"}
                surface="open_source"
              >
                Self-hosting guide
              </TrackedLandingLink>
            </div>
          </div>

          <div className="flex items-center bg-background/5 p-5 md:p-10">
            <div className="w-full overflow-x-auto rounded-2xl bg-zinc-950 p-5 font-mono text-[13px] text-zinc-200 leading-7 ring-1 ring-white/10 md:p-7">
              <p className="text-zinc-500"># configure, then boot</p>
              <p className="mt-3 whitespace-nowrap">
                <span className="text-violet-400">$</span> cp
                deploy/self-host/.env.example deploy/self-host/.env
              </p>
              <p className="whitespace-nowrap">
                <span className="text-violet-400">$</span> docker compose
                --env-file deploy/self-host/.env -f
                deploy/self-host/compose.yaml up -d
              </p>
              <div className="my-5 h-px bg-zinc-800" />
              <p className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                database healthy
              </p>
              <p className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                API and publisher ready
              </p>
              <p className="flex items-center gap-2 text-emerald-400">
                <Sparkles aria-hidden="true" className="size-4" />
                Community features unlocked
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="font-mono font-semibold text-primary text-xs uppercase tracking-[0.2em]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-semibold text-4xl tracking-[-0.045em] md:text-6xl">
        <Balancer>{title}</Balancer>
      </h2>
      <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground leading-8">
        <Balancer>{description}</Balancer>
      </p>
    </div>
  );
}

function WorkflowCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 md:p-8">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-6 font-semibold text-2xl tracking-tight">{title}</h3>
      <p className="mt-3 max-w-xl text-muted-foreground leading-7">
        {description}
      </p>
      {children}
    </article>
  );
}

function ControlCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <article className="min-h-52 rounded-3xl bg-card p-7 ring-1 ring-foreground/10">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-7 font-semibold text-xl tracking-tight">{title}</h3>
      <p className="mt-3 text-muted-foreground leading-7">{description}</p>
    </article>
  );
}
