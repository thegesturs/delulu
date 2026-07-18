"use client";
import {
  type CurrencyCode,
  DM_PLAN_LIMITS,
  formatDmLimit,
  PLANS,
} from "@delulu/payments";
import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useCurrency } from "@/hooks/use-currency";

function getFaqs(currency: CurrencyCode) {
  const echo = PLANS.ECHO;
  const vibe = PLANS.VIBE;
  const echoPrice =
    currency === "INR"
      ? `₹${echo.price.INR.monthly}/mo`
      : `$${echo.price.USD.monthly}/mo`;
  const vibePrice =
    currency === "INR"
      ? `₹${vibe.price.INR.monthly}/mo`
      : `$${vibe.price.USD.monthly}/mo`;

  return [
    {
      question: "What can an agent actually do with Delulu?",
      answer:
        "An authorized agent can inspect workspaces and accounts, prepare media, create drafts, schedule or publish posts, inspect delivery states, work with reviews, and read usage or analytics. Every action is still constrained by its scopes and your workspace role rules.",
    },
    {
      question: "How do I connect my agent?",
      answer:
        "Use the hosted MCP server for browser-capable agents, or install the Delulu CLI and packaged agent skill for local agents. Direct integrations can use the typed REST API. All three surfaces share the same authorization and publishing rules.",
    },
    {
      question: "Can an agent publish without my approval?",
      answer:
        "Only if you grant that access and the workspace allows it. You can restrict scopes, require post review, revoke credentials, or keep the agent draft-only. Delulu checks live permissions again when the operation runs.",
    },
    {
      question: "Which social networks are supported?",
      answer:
        "Delulu supports Instagram, Facebook, X, LinkedIn, TikTok, Pinterest, Threads, YouTube, Bluesky, and Farcaster. Available post types and settings still follow each network's official API capabilities.",
    },
    {
      question: "Is self-hosting free?",
      answer:
        "Yes. The Community self-hosted edition is available under AGPL-3.0 with core product features unlocked. You pay for your own infrastructure and external services. The first release requires your own Clerk and Cloudflare R2 projects; generic OIDC and S3-compatible storage are planned.",
    },
    {
      question: "Does the agent see my passwords or tokens?",
      answer:
        "No social passwords are shared with the agent. Social accounts connect through official OAuth flows, provider tokens are encrypted, and delegated agent credentials stay in the MCP client or the CLI's owner-only credential file.",
    },
    {
      question: "Does Delulu still support social automations?",
      answer: `Yes. Scheduling is the core agent workflow, and programmable automations remain available, including comment-triggered replies and Instagram DMs. Echo (${echoPrice}) includes ${formatDmLimit(DM_PLAN_LIMITS.ECHO)} auto-DMs each month; Vibe (${vibePrice}) includes ${formatDmLimit(DM_PLAN_LIMITS.VIBE)}.`,
    },
    {
      question: "What is included in hosted plans?",
      answer: `Hosted plans operate the infrastructure for you. Echo (${echoPrice}) includes ${echo.limits.socialAccounts} accounts and ${echo.limits.monthlyPosts} posts per month. Vibe (${vibePrice}) includes unlimited accounts and posts plus team features. You can cancel from billing at any time.`,
    },
  ];
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const currency = useCurrency();
  const faqs = getFaqs(currency);

  return (
    <section className="w-full border-t px-4 py-24 md:px-6 lg:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="font-mono font-semibold text-primary text-xs uppercase tracking-[0.2em]">
            Frequently asked
          </p>
          <h2 className="mx-auto mt-4 max-w-4xl font-semibold text-4xl tracking-[-0.045em] md:text-6xl">
            Questions before you hand an agent the calendar?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground leading-8">
            The short version: permissions stay explicit, outcomes stay
            inspectable, and self-hosting is a real option.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10">
          {faqs.map((faq, index) => (
            <div
              className="overflow-hidden border-border/70 border-b last:border-b-0"
              key={index}
            >
              <button
                aria-expanded={openIndex === index}
                className="flex min-h-16 w-full touch-manipulation items-center gap-3 px-5 py-5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:px-7"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                type="button"
              >
                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  initial={false}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 300, damping: 30 }
                  }
                >
                  <Plus className="text-primary" size={20} />
                </motion.div>
                <span className="font-medium text-foreground text-lg">
                  {faq.question}
                </span>
              </button>
              <AnimatePresence initial={!reduceMotion} mode="sync">
                {openIndex === index && (
                  <motion.div
                    animate="open"
                    className="overflow-hidden px-5 md:px-7"
                    exit="collapsed"
                    initial="collapsed"
                    key={`content-${index}`}
                    variants={{
                      open: {
                        height: "auto",
                        opacity: 1,
                        transition: {
                          ...(reduceMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 400,
                                damping: 40,
                                mass: 1,
                              }),
                        },
                      },
                      collapsed: {
                        height: 0,
                        opacity: 0,
                        transition: {
                          ...(reduceMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 400,
                                damping: 40,
                                mass: 1,
                              }),
                        },
                      },
                    }}
                  >
                    <div className="pb-6 pl-8">
                      <p className="max-w-3xl whitespace-pre-line text-muted-foreground leading-7">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
