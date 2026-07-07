"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  CURRENCY_SYMBOLS,
  type CurrencyCode,
  LIFETIME_DEAL_ACTIVE,
  LIFETIME_PRICE,
} from "@delulu/payments";
import {
  ArrowDown01Icon,
  BubbleChatIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  FlashIcon,
  Globe02Icon,
  SparklesIcon,
  Tick02Icon,
  UserMultipleIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { AnimatePresence, motion, useInView } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Balancer from "react-wrap-balancer";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { useCurrency } from "@/hooks/use-currency";

// ---------------------------------------------------------------------------
// Countdown Timer Hook
// ---------------------------------------------------------------------------

/** Deal expires 48 hours from first deploy — set this to your launch timestamp */
const DEAL_END_DATE = new Date("2026-03-23T23:59:59Z").getTime();

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = DEAL_END_DATE - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = DEAL_END_DATE - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: timeLeft <= 0 };
}

const DEALS_REMAINING = 18;
const DEALS_TOTAL = 20;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  "Unlimited social accounts",
  "Unlimited posts per month",
  "Unlimited media storage",
  "Priority support",
  "1,000 free transcriptions",
  "All future features & updates",
  "No recurring fees — ever",
];

const FEATURE_CATEGORIES = [
  {
    icon: Globe02Icon,
    title: "8+ Platforms",
    description:
      "Instagram, TikTok, LinkedIn, YouTube, Twitter, Facebook, Pinterest, Threads — all from one dashboard.",
  },
  {
    icon: BubbleChatIcon,
    title: "DM Automation",
    description:
      "Auto-DM anyone who comments a keyword. Auto-reply to comments. Unlimited automations.",
  },
  {
    icon: FlashIcon,
    title: "AI-Powered",
    description:
      "Generate captions, transcribe videos, repurpose content across platforms with built-in AI.",
  },
  {
    icon: UserMultipleIcon,
    title: "Team Ready",
    description:
      "Real-time collaborative editing, organization management, and role-based access control.",
  },
];

const COMPETITORS = [
  { name: "Buffer", monthly: 15, platforms: 3, dms: false, scheduling: true },
  {
    name: "Hootsuite",
    monthly: 99,
    platforms: 10,
    dms: false,
    scheduling: true,
  },
  { name: "Later", monthly: 25, platforms: 4, dms: false, scheduling: true },
  {
    name: "ManyChat",
    monthly: 67,
    platforms: 1,
    dms: true,
    scheduling: false,
  },
];

function getLtdFaqs(currency: CurrencyCode) {
  const symbol = CURRENCY_SYMBOLS[currency];
  const price =
    currency === "INR"
      ? LIFETIME_PRICE.INR.toLocaleString("en-IN")
      : LIFETIME_PRICE.USD.toString();
  return [
    {
      question: "What exactly do I get with the lifetime deal?",
      answer:
        "Everything in the VIBE plan — unlimited social accounts, unlimited posts, unlimited storage, priority support, and 1,000 free transcriptions via Sorted. Plus every future feature we ship, forever. No limits, no expiry.",
    },
    {
      question: "Is this really a one-time payment?",
      answer: `Yes. You pay ${symbol}${price} once and never see another charge from us. No monthly fees. No annual renewals. No sneaky price increases. One payment, lifetime access.`,
    },
    {
      question: "What happens if Delulu Social shuts down?",
      answer:
        "We're backed, profitable on unit economics, and building for the long haul. But worst case — you'll always be able to export your data, and your LTD will have paid for itself within months compared to any competitor's monthly pricing.",
    },
    {
      question: "Do I get all future features?",
      answer:
        "Every single one. New platforms, new automation types, new AI features — if we build it, you get it. Lifetime means lifetime.",
    },
    {
      question: "What are the 1,000 transcriptions?",
      answer:
        "Our Sorted extension transcribes audio and video content — great for repurposing podcasts, reels, and YouTube videos into text posts. You get 1,000 transcriptions included with your LTD.",
    },
    {
      question: "What's the refund policy?",
      answer:
        "60-day money-back guarantee. Try it for two full months. If Delulu isn't replacing your current tools, email us and we'll refund you — no questions asked.",
    },
    {
      question: "How is this different from the monthly VIBE plan?",
      answer:
        "Same features, better deal. The monthly VIBE plan costs $9.99/mo ($120/year). The lifetime deal pays for itself in about 15 months — then it's free forever. Plus you get 1,000 bonus transcriptions that monthly users don't get.",
    },
  ];
}

const SIGN_IN_URL = "https://solulu.delulu.social/sign-in";

// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 font-bold font-mono text-2xl text-destructive tabular-nums sm:px-4 sm:py-3 sm:text-4xl">
        {pad(value)}
      </div>
      <span className="mt-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}

function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const { hours, minutes, seconds, expired } = useCountdown();

  if (expired) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-6 py-3">
        <span className="font-bold text-destructive text-lg uppercase tracking-wider">
          Deal Expired
        </span>
      </div>
    );
  }

  if (compact) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      <span className="font-bold font-mono text-destructive tabular-nums">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <CountdownUnit label="Hours" value={hours} />
      <span className="mb-5 font-bold text-destructive/40 text-xl">:</span>
      <CountdownUnit label="Minutes" value={minutes} />
      <span className="mb-5 font-bold text-destructive/40 text-xl">:</span>
      <CountdownUnit label="Seconds" value={seconds} />
    </div>
  );
}

function StaggerReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      ref={ref}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Hero
// ---------------------------------------------------------------------------

function HeroSection({
  currencySymbol,
  formatNum,
  isINR,
}: {
  currencySymbol: string;
  formatNum: (n: number) => string;
  isINR: boolean;
}) {
  const fiveYearCost = isINR ? 53_940 : 495;
  const price = LIFETIME_PRICE[isINR ? "INR" : "USD"];

  return (
    <div className="relative overflow-hidden">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-32 pb-24 text-center sm:pt-40 sm:pb-32">
        {/* Countdown Banner */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex flex-col items-center gap-4 rounded-lg border border-border/60 bg-card/50 px-6 py-5 backdrop-blur-md sm:px-10 sm:py-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="font-semibold text-xs uppercase tracking-[0.15em]">
                48-Hour Flash Sale
              </span>
              <span className="text-border">|</span>
              <span className="font-semibold text-destructive text-xs uppercase tracking-[0.15em]">
                {DEALS_REMAINING} of {DEALS_TOTAL} left
              </span>
            </div>
            <CountdownTimer />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 font-extrabold text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-[-0.04em]"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Balancer>
            <span className="block text-foreground">Pay once.</span>
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Post forever.
            </span>
          </Balancer>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-12 max-w-xl text-base text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <Balancer>
            We&apos;re releasing just {DEALS_TOTAL} lifetime licenses to Delulu
            Social&apos;s unlimited plan. 2 are already gone. When the timer
            hits zero — this page disappears.
          </Balancer>
        </motion.p>

        {/* Price anchor + CTA */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground/60 line-through decoration-2 decoration-destructive/40">
              {currencySymbol}
              {formatNum(fiveYearCost)}
            </span>
            <span className="font-extrabold text-4xl tracking-tight sm:text-5xl">
              {currencySymbol}
              {formatNum(price)}
            </span>
            <span className="rounded bg-primary/10 px-3 py-1 font-semibold text-primary text-xs">
              {Math.round(((fiveYearCost - price) / fiveYearCost) * 100)}% OFF
            </span>
          </div>

          <Button
            asChild
            className="h-14 px-10 font-semibold text-base"
            size="lg"
          >
            <Link href="#pricing">Get Lifetime Access</Link>
          </Button>

          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Icon icon={CheckmarkCircle02Icon} size={12} />
            One-time payment · 60-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Pricing Card
// ---------------------------------------------------------------------------

function PricingSection({
  currency,
  currencySymbol,
  formatNum,
  isINR,
}: {
  currency: CurrencyCode;
  currencySymbol: string;
  formatNum: (n: number) => string;
  isINR: boolean;
}) {
  const price = LIFETIME_PRICE[currency];
  const monthlyEquiv = isINR
    ? Math.round(price / 60).toLocaleString("en-IN")
    : (price / 60).toFixed(2);

  return (
    <section className="relative border-t py-24" id="pricing">
      <div className="relative mx-auto max-w-lg px-4">
        <StaggerReveal>
          <div className="mb-12 text-center">
            <p className="mb-3 font-semibold text-primary text-xs uppercase tracking-[0.2em]">
              Limited Offer
            </p>
            <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
              <Balancer>The Lifetime Deal</Balancer>
            </h2>
          </div>
        </StaggerReveal>

        <StaggerReveal delay={0.1}>
          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-primary/30 bg-card">
              {/* Top badge */}
              <div className="flex items-center justify-center gap-2 border-primary/10 border-b bg-primary/5 py-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
                <span className="font-bold text-[11px] uppercase tracking-[0.15em]">
                  {DEALS_REMAINING} of {DEALS_TOTAL} remaining
                </span>
              </div>

              <div className="p-8 sm:p-10">
                {/* Price */}
                <div className="mb-8 text-center">
                  <p className="mb-1 font-medium text-muted-foreground text-sm">
                    Full VIBE plan — forever
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-extrabold text-5xl tracking-tight sm:text-6xl">
                      {currencySymbol}
                      {formatNum(price)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">
                    That&apos;s just {currencySymbol}
                    {monthlyEquiv}/mo over 5 years
                  </p>
                </div>

                {/* CTA */}
                <Button
                  asChild
                  className="mb-8 h-14 w-full font-semibold text-base"
                  size="lg"
                >
                  <Link href={SIGN_IN_URL}>Get Lifetime Access</Link>
                </Button>

                {/* Features */}
                <ul className="space-y-3.5">
                  {FEATURES.map((feature) => (
                    <li className="flex items-center gap-3" key={feature}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Icon
                          className="text-primary"
                          icon={Tick02Icon}
                          size={14}
                        />
                      </div>
                      <span className="text-foreground/80 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom trust strip */}
              <div className="border-border/50 border-t bg-muted/30 px-8 py-4">
                <p className="text-center text-muted-foreground text-xs">
                  60-day money-back guarantee · Instant access · No card tricks
                </p>
              </div>
            </div>
          </div>
        </StaggerReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Features
// ---------------------------------------------------------------------------

function FeaturesSection() {
  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-5xl px-4">
        <StaggerReveal>
          <div className="mb-16 text-center">
            <p className="mb-3 font-semibold text-primary text-xs uppercase tracking-[0.2em]">
              Everything Included
            </p>
            <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
              <Balancer>One tool to replace them all</Balancer>
            </h2>
          </div>
        </StaggerReveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURE_CATEGORIES.map((cat, i) => (
            <StaggerReveal delay={i * 0.08} key={cat.title}>
              <div className="group relative h-full rounded-lg border border-border/60 bg-card/50 p-6 transition-colors duration-300 hover:border-primary/20 hover:bg-card sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon icon={cat.icon} size={20} />
                </div>
                <h3 className="mb-2 font-semibold text-foreground text-lg">
                  {cat.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </StaggerReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Competitor Comparison
// ---------------------------------------------------------------------------

function ComparisonSection({
  currency,
  currencySymbol,
  formatNum,
}: {
  currency: CurrencyCode;
  currencySymbol: string;
  formatNum: (n: number) => string;
}) {
  const deluluPrice = LIFETIME_PRICE[currency];

  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-4xl px-4">
        <StaggerReveal>
          <div className="mb-16 text-center">
            <p className="mb-3 font-semibold text-primary text-xs uppercase tracking-[0.2em]">
              The Math
            </p>
            <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">
              <Balancer>5-year cost comparison</Balancer>
            </h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              What you&apos;d pay over 5 years with each tool. The numbers speak
              for themselves.
            </p>
          </div>
        </StaggerReveal>

        <StaggerReveal delay={0.1}>
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border/60 border-b">
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground" />
                    {COMPETITORS.map((c) => (
                      <th
                        className="px-4 py-4 text-center font-medium text-muted-foreground"
                        key={c.name}
                      >
                        {c.name}
                      </th>
                    ))}
                    <th className="border-primary/10 border-l bg-primary/[0.03] px-4 py-4 text-center font-bold text-primary">
                      Delulu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="px-5 py-4 font-medium">Monthly</td>
                    {COMPETITORS.map((c) => (
                      <td
                        className="px-4 py-4 text-center text-muted-foreground"
                        key={c.name}
                      >
                        ${c.monthly}
                      </td>
                    ))}
                    <td className="border-primary/10 border-l bg-primary/[0.03] px-4 py-4 text-center font-semibold text-primary">
                      {currencySymbol}
                      {formatNum(deluluPrice)}
                      <span className="ml-1 text-xs opacity-70">once</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium">5-year cost</td>
                    {COMPETITORS.map((c) => (
                      <td
                        className="px-4 py-4 text-center font-semibold text-destructive"
                        key={c.name}
                      >
                        ${(c.monthly * 60).toLocaleString()}
                      </td>
                    ))}
                    <td className="border-primary/10 border-l bg-primary/[0.03] px-4 py-4 text-center font-bold text-primary">
                      {currencySymbol}
                      {formatNum(deluluPrice)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium">Platforms</td>
                    {COMPETITORS.map((c) => (
                      <td
                        className="px-4 py-4 text-center text-muted-foreground"
                        key={c.name}
                      >
                        {c.platforms}
                      </td>
                    ))}
                    <td className="border-primary/10 border-l bg-primary/[0.03] px-4 py-4 text-center font-semibold text-primary">
                      8+
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium">DM Automation</td>
                    {COMPETITORS.map((c) => (
                      <td className="px-4 py-4 text-center" key={c.name}>
                        {c.dms ? (
                          <Icon
                            className="mx-auto text-muted-foreground"
                            icon={Tick02Icon}
                            size={16}
                          />
                        ) : (
                          <Icon
                            className="mx-auto text-muted-foreground/30"
                            icon={Cancel01Icon}
                            size={16}
                          />
                        )}
                      </td>
                    ))}
                    <td className="border-primary/10 border-l bg-primary/[0.03] px-4 py-4 text-center">
                      <Icon
                        className="mx-auto text-primary"
                        icon={Tick02Icon}
                        size={16}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium">Scheduling</td>
                    {COMPETITORS.map((c) => (
                      <td className="px-4 py-4 text-center" key={c.name}>
                        {c.scheduling ? (
                          <Icon
                            className="mx-auto text-muted-foreground"
                            icon={Tick02Icon}
                            size={16}
                          />
                        ) : (
                          <Icon
                            className="mx-auto text-muted-foreground/30"
                            icon={Cancel01Icon}
                            size={16}
                          />
                        )}
                      </td>
                    ))}
                    <td className="border-primary/10 border-l bg-primary/[0.03] px-4 py-4 text-center">
                      <Icon
                        className="mx-auto text-primary"
                        icon={Tick02Icon}
                        size={16}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </StaggerReveal>

        <StaggerReveal delay={0.15}>
          <p className="mt-6 text-center text-muted-foreground text-sm">
            Hootsuite alone costs{" "}
            <span className="font-semibold text-foreground">$5,940</span> over 5
            years. Delulu costs{" "}
            <span className="font-semibold text-primary">
              {currencySymbol}
              {formatNum(deluluPrice)}
            </span>
            . Once.
          </p>
        </StaggerReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 5: FAQ
// ---------------------------------------------------------------------------

function FaqSection({ currency }: { currency: CurrencyCode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = getLtdFaqs(currency);

  return (
    <section className="border-t py-24">
      <div className="mx-auto max-w-3xl px-4">
        <StaggerReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 font-semibold text-primary text-xs uppercase tracking-[0.2em]">
              FAQ
            </p>
            <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
              <Balancer>Questions before you commit?</Balancer>
            </h2>
          </div>
        </StaggerReveal>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <StaggerReveal delay={index * 0.04} key={index}>
              <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50 transition-colors hover:bg-card">
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  type="button"
                >
                  <span className="font-medium text-[15px] text-foreground">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    className="shrink-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Icon
                      className="text-muted-foreground"
                      icon={ArrowDown01Icon}
                      size={16}
                    />
                  </motion.div>
                </button>
                <AnimatePresence mode="sync">
                  {openIndex === index && (
                    <motion.div
                      animate="open"
                      className="overflow-hidden"
                      exit="collapsed"
                      initial="collapsed"
                      key={`content-${index}`}
                      variants={{
                        open: {
                          height: "auto",
                          opacity: 1,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 40,
                            mass: 1,
                          },
                        },
                        collapsed: {
                          height: 0,
                          opacity: 0,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 40,
                            mass: 1,
                          },
                        },
                      }}
                    >
                      <div className="border-border/40 border-t px-6 py-5">
                        <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </StaggerReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Final CTA
// ---------------------------------------------------------------------------

function FinalCtaSection({
  currencySymbol,
  formatNum,
  currency,
}: {
  currencySymbol: string;
  formatNum: (n: number) => string;
  currency: CurrencyCode;
}) {
  const price = LIFETIME_PRICE[currency];

  return (
    <section className="relative overflow-hidden border-t">
      {/* Canvas background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <CanvasRevealEffect
          animationSpeed={0.8}
          colors={[[99, 102, 241]]}
          dotSize={2}
        />
        <div className="absolute inset-0 bg-radial/[in_oklch] from-background/70 via-background/90 to-background" />
      </div>

      <div className="relative py-28 sm:py-36">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <StaggerReveal>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-destructive/20 bg-destructive/5 px-5 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="font-semibold text-xs uppercase tracking-[0.15em]">
                {DEALS_REMAINING} of {DEALS_TOTAL} left
              </span>
              <span className="text-border">|</span>
              <CountdownTimer compact />
            </div>
          </StaggerReveal>

          <StaggerReveal delay={0.1}>
            <h2 className="mb-6 font-extrabold text-3xl tracking-tight sm:text-5xl">
              <Balancer>
                Stop renting.
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Start owning.
                </span>
              </Balancer>
            </h2>
          </StaggerReveal>

          <StaggerReveal delay={0.15}>
            <p className="mb-10 text-lg text-muted-foreground">
              <span className="font-bold text-foreground">
                {currencySymbol}
                {formatNum(price)}
              </span>{" "}
              once — less than 2 months of Hootsuite.
            </p>
          </StaggerReveal>

          <StaggerReveal delay={0.2}>
            <div className="flex flex-col items-center gap-4">
              <Button
                asChild
                className="h-14 px-10 font-semibold text-base"
                size="lg"
              >
                <Link href={SIGN_IN_URL}>Get Lifetime Access</Link>
              </Button>

              <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon icon={SparklesIcon} size={12} />
                60-day money-back guarantee · One-time payment · Instant access
              </p>
            </div>
          </StaggerReveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

function LifetimeEnded() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="mb-4 font-bold text-4xl tracking-tight">
        Lifetime deal ended
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        The lifetime offer is no longer available for new customers. Subscribe
        to Echo or Vibe — same auto-DM power, monthly billing, 14-day
        money-back guarantee.
      </p>
      <Button asChild size="lg">
        <Link href="/pricing">View plans</Link>
      </Button>
    </div>
  );
}

export default function Lifetime() {
  if (!LIFETIME_DEAL_ACTIVE) {
    return <LifetimeEnded />;
  }

  const currency = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const isINR = currency === "INR";
  const formatNum = (n: number) =>
    isINR ? Math.round(n).toLocaleString("en-IN") : n.toLocaleString();

  return (
    <>
      <HeroSection
        currencySymbol={currencySymbol}
        formatNum={formatNum}
        isINR={isINR}
      />
      <PricingSection
        currency={currency}
        currencySymbol={currencySymbol}
        formatNum={formatNum}
        isINR={isINR}
      />
      <FeaturesSection />
      <ComparisonSection
        currency={currency}
        currencySymbol={currencySymbol}
        formatNum={formatNum}
      />
      <FaqSection currency={currency} />
      <FinalCtaSection
        currency={currency}
        currencySymbol={currencySymbol}
        formatNum={formatNum}
      />
    </>
  );
}
