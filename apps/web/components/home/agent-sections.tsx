import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import {
  Bot,
  Braces,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  Database,
  Github,
  KeyRound,
  MessageSquareMore,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Terminal,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

const DOCS_URL = "https://docs.delulu.social";
const SOURCE_URL = "https://github.com/thegesturs/delulu";

const setupSteps = [
  {
    number: "01",
    title: "Authorize once",
    description:
      "Approve a workspace and the exact scopes your agent needs. Tokens stay out of the conversation.",
  },
  {
    number: "02",
    title: "Connect your accounts",
    description:
      "Complete each network's official OAuth flow while Delulu keeps credentials encrypted.",
  },
  {
    number: "03",
    title: "Delegate the calendar",
    description:
      "Ask your agent to prepare media, schedule a campaign, or publish now. It reports the real result.",
  },
] as const;

const surfaces = [
  {
    icon: RadioTower,
    title: "Hosted MCP",
    description:
      "Connect browser-capable agents to structured tools with delegated OAuth and no pasted API keys.",
    href: `${DOCS_URL}/mcp/overview/`,
    action: "Connect MCP",
  },
  {
    icon: Terminal,
    title: "CLI + agent skill",
    description:
      "Give local agents deterministic commands, local-file uploads, JSON or TOON output, and explicit exit codes.",
    href: `${DOCS_URL}/getting-started/agent-setup/`,
    action: "Install the skill",
  },
  {
    icon: Braces,
    title: "Typed REST API",
    description:
      "Build your own agent workflow on versioned contracts, OAuth scopes, idempotency, and authoritative states.",
    href: `${DOCS_URL}/api-reference/`,
    action: "Read the API",
  },
] as const;

const controls = [
  {
    icon: KeyRound,
    title: "Delegated access",
    description:
      "Agents receive revocable scopes, never your social passwords.",
  },
  {
    icon: UsersRound,
    title: "Live workspace roles",
    description: "Every operation re-checks membership and role permissions.",
  },
  {
    icon: ShieldCheck,
    title: "Human review",
    description: "Require approval before a draft is allowed to publish.",
  },
  {
    icon: RefreshCw,
    title: "Reliable outcomes",
    description:
      "Retries reuse operation identity and report partial failures honestly.",
  },
] as const;

const capabilities = [
  {
    icon: CalendarClock,
    title: "Scheduling and publishing",
    description:
      "Draft, schedule, publish now, and inspect each network target.",
  },
  {
    icon: Database,
    title: "Reusable media",
    description:
      "Upload local files or import public media once, then reuse it safely.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Analytics",
    description:
      "Let agents inspect account health, usage, and post performance.",
  },
  {
    icon: MessageSquareMore,
    title: "Programmable automation",
    description: "Build workflows such as comment-triggered replies and DMs.",
  },
] as const;

export function AgentSections() {
  return (
    <>
      <section className="border-t px-4 py-24 md:px-8" id="agents">
        <SectionHeading
          description="The browser handles consent. Your agent handles the operational work before and after it."
          eyebrow="From prompt to calendar"
          title="One prompt to a scheduled post."
        />
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {setupSteps.map((step) => (
            <Card className="bg-card/70" key={step.number}>
              <CardContent className="p-7">
                <span className="font-mono text-primary text-sm">
                  {step.number}
                </span>
                <h3 className="mt-5 font-semibold text-xl">{step.title}</h3>
                <p className="mt-3 text-muted-foreground leading-7">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-24 md:px-8" id="product">
        <SectionHeading
          description="Use the surface that fits your runtime. Every path reaches the same publishing rules and source of truth."
          eyebrow="Three interfaces, one permission model"
          title="Works wherever your agent works."
        />
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
          {surfaces.map(({ icon: Icon, ...surface }) => (
            <Card className="flex h-full flex-col" key={surface.title}>
              <CardContent className="flex h-full flex-col p-7">
                <Icon aria-hidden="true" className="size-7 text-primary" />
                <h3 className="mt-6 font-semibold text-xl">{surface.title}</h3>
                <p className="mt-3 flex-1 text-muted-foreground leading-7">
                  {surface.description}
                </p>
                <Link
                  className="mt-7 font-medium text-primary"
                  href={surface.href}
                >
                  {surface.action} →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <TerminalExchange />
      </section>

      <section className="border-t px-4 py-24 md:px-8">
        <SectionHeading
          description="Automation should remove repetitive work without removing ownership or accountability."
          eyebrow="Permission-aware by default"
          title="Built for agents. Controlled by people."
        />
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {controls.map(({ icon: Icon, ...control }) => (
            <div className="rounded-2xl border bg-card p-6" key={control.title}>
              <Icon aria-hidden="true" className="size-6 text-primary" />
              <h3 className="mt-5 font-semibold">{control.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                {control.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-24 md:px-8">
        <SectionHeading
          description="Your agent can prepare the work, route it through your rules, and follow it to a real outcome."
          eyebrow="More than a posting endpoint"
          title="A complete social operating layer."
        />
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {capabilities.map(({ icon: Icon, ...capability }) => (
            <Card key={capability.title}>
              <CardContent className="flex gap-5 p-7">
                <div className="h-fit rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon aria-hidden="true" className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{capability.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-7">
                    {capability.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t px-4 py-24 md:px-8" id="open-source">
        <div className="mx-auto grid max-w-6xl items-center gap-12 rounded-3xl border bg-card p-7 md:p-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-medium text-primary text-sm">
              AGPL-3.0 open source
            </p>
            <h2 className="mt-4 font-bold text-3xl tracking-tight md:text-5xl">
              <Balancer>Run the social layer your agents depend on.</Balancer>
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-8">
              Self-host Delulu with Docker Compose and PostgreSQL, keep your
              data on infrastructure you control, and inspect every line that
              stands between an agent and your accounts.
            </p>
            <p className="mt-4 text-muted-foreground text-sm leading-6">
              The first self-hosted release requires your own Clerk and
              Cloudflare R2 projects. Generic OIDC and S3-compatible storage are
              planned next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={SOURCE_URL}>
                  <Github aria-hidden="true" className="mr-2 size-4" />
                  View the source
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`${DOCS_URL}/self-hosting/`}>
                  Self-hosting guide
                </Link>
              </Button>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border bg-background p-5 font-mono text-sm">
            <p className="text-muted-foreground"># configure, then boot</p>
            <p>
              <span className="text-primary">$</span> cp .env.selfhost.example
              .env
            </p>
            <p>
              <span className="text-primary">$</span> docker compose up -d
            </p>
            <div className="my-4 h-px bg-border" />
            <p className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              database healthy
            </p>
            <p className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              API and publisher ready
            </p>
            <p className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              Community features unlocked
            </p>
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
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <p className="font-medium text-primary text-sm">{eyebrow}</p>
      <h2 className="mt-4 font-bold text-3xl tracking-tight md:text-5xl">
        <Balancer>{title}</Balancer>
      </h2>
      <p className="mt-5 text-lg text-muted-foreground leading-8">
        <Balancer>{description}</Balancer>
      </p>
    </div>
  );
}

function TerminalExchange() {
  return (
    <figure className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border bg-zinc-950 text-zinc-100 shadow-2xl">
      <div className="flex items-center gap-2 border-zinc-800 border-b px-5 py-3">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 font-mono text-xs text-zinc-500">
          agent session
        </span>
      </div>
      <div className="space-y-4 overflow-x-auto p-6 font-mono text-sm leading-7">
        <p>
          <span className="text-violet-400">you</span> Schedule launch.mp4 for
          LinkedIn tomorrow at 9am.
        </p>
        <p className="text-zinc-400">
          $ delulu post "We just shipped." --to linkedin --media launch.mp4 --at
          2026-07-17T09:00:00+05:30
        </p>
        <p>
          {"{"} "status": "scheduled", "targets": [{"{"} "network": "linkedin",
          "status": "pending" {"}"}] {"}"}
        </p>
        <p className="text-emerald-400">
          Scheduled. I’ll report the platform result after delivery.
        </p>
      </div>
      <figcaption className="sr-only">
        A terminal exchange where an agent uses the Delulu CLI to schedule a
        LinkedIn video and reports the authoritative scheduled state.
      </figcaption>
    </figure>
  );
}
