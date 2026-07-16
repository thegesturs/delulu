"use client";

import { Bot, Braces, CheckCircle2, RadioTower, Terminal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const interfaces = [
  { label: "MCP", icon: RadioTower },
  { label: "CLI", icon: Terminal },
  { label: "API", icon: Braces },
] as const;

const networks = [
  "Instagram",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "Threads",
  "Bluesky",
] as const;

export function AgentWorkflowGraphic() {
  const reduceMotion = useReducedMotion();

  return (
    <figure
      aria-labelledby="agent-workflow-caption"
      className="rounded-3xl border bg-background/85 p-4 shadow-2xl backdrop-blur md:p-8"
    >
      <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1.3fr_auto_1fr]">
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border bg-card p-6 text-center">
          <div className="mb-4 rounded-2xl bg-primary/10 p-3 text-primary">
            <Bot aria-hidden="true" className="size-8" />
          </div>
          <p className="font-semibold">Your agent</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Plans and delegates the work
          </p>
        </div>

        <FlowArrow reduceMotion={Boolean(reduceMotion)} />

        <div className="rounded-2xl border bg-card p-5">
          <p className="mb-4 text-center font-medium text-muted-foreground text-sm">
            One permission-aware interface
          </p>
          <div className="grid grid-cols-3 gap-2">
            {interfaces.map(({ label, icon: Icon }) => (
              <div
                className="flex flex-col items-center rounded-xl border bg-background px-3 py-4"
                key={label}
              >
                <Icon aria-hidden="true" className="mb-2 size-5 text-primary" />
                <span className="font-semibold text-sm">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-primary text-sm">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Scopes, roles, reviews, and retries enforced
          </div>
        </div>

        <FlowArrow reduceMotion={Boolean(reduceMotion)} />

        <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-card p-4">
          {networks.map((network, index) => (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center rounded-xl border bg-background px-2 py-3 text-center font-medium text-xs"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              key={network}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              {network}
            </motion.div>
          ))}
        </div>
      </div>
      <figcaption
        className="mt-5 text-center text-muted-foreground text-sm"
        id="agent-workflow-caption"
      >
        Your agent chooses the interface. Delulu applies human-approved access
        rules before anything reaches a social network.
      </figcaption>
    </figure>
  );
}

function FlowArrow({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center py-1">
      <div className="relative h-px w-12 overflow-hidden bg-border lg:w-10">
        <motion.div
          animate={reduceMotion ? undefined : { x: ["-100%", "100%"] }}
          className="absolute inset-y-0 w-1/2 bg-primary"
          transition={{
            duration: 1.8,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      </div>
    </div>
  );
}
