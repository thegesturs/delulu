"use client";

import { useAnalytics } from "@delulu/analytics/posthog/client";
import { Button } from "@delulu/design-system/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { AgentWorkflowGraphic } from "./agent-workflow-graphic";
import { GradientBars } from "./gradient-bars";

const AGENT_SETUP_URL =
  "https://docs.delulu.social/getting-started/agent-setup/";
const SOURCE_URL = "https://github.com/thegesturs/delulu";

export function Hero() {
  const analytics = useAnalytics();
  const reduceMotion = useReducedMotion();

  const capture = (destination: "agent_setup" | "source") => {
    analytics?.capture("landing_agent_cta_clicked", { destination });
  };

  return (
    <section
      className="relative mx-auto overflow-hidden px-4 pt-32 md:px-8 md:pt-40"
      id="home"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <GradientBars bars={20} colors={["#4338ca", "transparent"]} />
      </div>

      <div className="relative z-20 mx-auto max-w-4xl text-center">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-6 w-fit rounded-full border bg-background/70 px-4 py-2 font-medium text-primary text-sm backdrop-blur"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        >
          Open-source social scheduling for AI agents
        </motion.p>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 font-bold text-5xl text-foreground tracking-tight md:text-7xl"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Balancer>Your agent can run your social media.</Balancer>
        </motion.h1>
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground md:text-xl"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Balancer>
            Give your agent permissioned tools to prepare media, schedule,
            publish, and handle approvals across 10+ social networks. Use MCP,
            the CLI, or the API. Run it hosted or self-host it.
          </Balancer>
        </motion.p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button asChild size="lg">
            <Link href={AGENT_SETUP_URL} onClick={() => capture("agent_setup")}>
              Connect your agent
              <ArrowRight aria-hidden="true" className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={SOURCE_URL} onClick={() => capture("source")}>
              <Github aria-hidden="true" className="mr-2 size-4" />
              View on GitHub
            </Link>
          </Button>
        </motion.div>
        <p className="mx-auto mb-12 max-w-2xl text-muted-foreground text-sm">
          Your agent gets scoped access. You keep account ownership, approval
          rules, and the final say on every post.
        </p>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto max-w-6xl pb-20"
        initial={reduceMotion ? false : { opacity: 0, y: 32 }}
        transition={{ duration: 0.65, delay: 0.35 }}
      >
        <AgentWorkflowGraphic />
      </motion.div>
    </section>
  );
}
