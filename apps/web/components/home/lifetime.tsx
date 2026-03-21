"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import {
  CURRENCY_SYMBOLS,
  type CurrencyCode,
  LIFETIME_TIERS,
} from "@delulu/payments";
import { Check, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Balancer from "react-wrap-balancer";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import LineSvg from "@/components/ui/line-svg";
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

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const LIFETIME_TIERS_UI = LIFETIME_TIERS.map((tier, i) => ({
  ...tier,
  highlighted: i === 1, // middle tier (Team) is highlighted
}));

const FEATURE_CATEGORIES = [
  {
    title: "Publishing",
    icon: "publish",
    features: [
      "Post to 8+ platforms at once",
      "Instagram, TikTok, LinkedIn, YouTube, Twitter, Facebook, Pinterest, Threads",
      "Unlimited scheduled posts",
      "Unlimited media storage",
      "Carousel & video support",
    ],
  },
  {
    title: "DM Automation",
    icon: "dm",
    features: [
      "Keyword-triggered auto-DMs",
      "Automatic comment replies",
      "Custom DM templates",
      "Unlimited automations",
    ],
  },
  {
    title: "Team & Collaboration",
    icon: "team",
    features: [
      "Up to 5 team seats (Agency tier)",
      "Real-time collaborative editing",
      "Organization management",
      "Role-based access",
    ],
  },
  {
    title: "Lifetime Bonus",
    icon: "bonus",
    features: [
      "1,000 free transcriptions (Sorted)",
      "All future features included",
      "Priority support forever",
      "No recurring fees — ever",
    ],
  },
];

const COMPETITORS = [
  {
    name: "Buffer",
    monthly: 15,
    platforms: 3,
    dms: false,
    scheduling: true,
    seats: 1,
  },
  {
    name: "Hootsuite",
    monthly: 99,
    platforms: 10,
    dms: false,
    scheduling: true,
    seats: 1,
  },
  {
    name: "Later",
    monthly: 25,
    platforms: 4,
    dms: false,
    scheduling: true,
    seats: 1,
  },
  {
    name: "ManyChat",
    monthly: 67,
    platforms: 1,
    dms: true,
    scheduling: false,
    seats: 1,
  },
];

function getLtdFaqs(currency: CurrencyCode) {
  const symbol = CURRENCY_SYMBOLS[currency];
  const soloPrice = currency === "INR" ? "9,999" : "149";
  return [
    {
      question: "What exactly do I get with the lifetime deal?",
      answer:
        "Everything in the VIBE plan — unlimited social accounts, unlimited posts, unlimited storage, priority support, and 1,000 free transcriptions via Sorted. Plus every future feature we ship, forever. No limits, no expiry.",
    },
    {
      question: "Is this really a one-time payment?",
      answer: `Yes. You pay ${symbol}${soloPrice} once (Solo tier) and never see another charge from us. No monthly fees. No annual renewals. No sneaky price increases. One payment, lifetime access.`,
    },
    {
      question: "What happens if Delulu Social shuts down?",
      answer:
        "We're backed, profitable on unit economics, and building for the long haul. But worst case — you'll always be able to export your data, and your LTD will have paid for itself within months compared to any competitor's monthly pricing.",
    },
    {
      question: "Can I upgrade my seat count later?",
      answer:
        "Yes. You can upgrade from Solo to Team or Agency anytime by paying the difference. We'll never charge you more than the listed upgrade price.",
    },
    {
      question: "Do I get all future features?",
      answer:
        "Every single one. New platforms, new automation types, new AI features — if we build it, you get it. Lifetime means lifetime.",
    },
    {
      question: "What are the 1,000 transcriptions?",
      answer:
        "Our Sorted extension transcribes audio and video content — great for repurposing podcasts, reels, and YouTube videos into text posts. You get 1,000 transcriptions included with your LTD. After that, you can purchase more at standard rates.",
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

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const SIGN_IN_URL = "https://solulu.delulu.social/sign-in";

const CheckIcon = ({ highlighted = false }: { highlighted?: boolean }) => (
  <svg
    className={cn(
      "mr-3 h-5 w-5 shrink-0",
      highlighted ? "text-primary" : "text-muted-foreground"
    )}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      fillRule="evenodd"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Section 1: Hero
// ---------------------------------------------------------------------------

function CountdownTimer() {
  const { hours, minutes, seconds, expired } = useCountdown();

  if (expired) {
    return (
      <span className="font-bold font-mono text-destructive">DEAL EXPIRED</span>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1 font-mono text-lg">
      <div className="rounded-md bg-foreground/10 px-2 py-1 font-bold">
        {pad(hours)}h
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="rounded-md bg-foreground/10 px-2 py-1 font-bold">
        {pad(minutes)}m
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="rounded-md bg-foreground/10 px-2 py-1 font-bold">
        {pad(seconds)}s
      </div>
    </div>
  );
}

function HeroSection({
  currencySymbol,
  formatNum,
  isINR,
}: {
  currencySymbol: string;
  formatNum: (n: number) => string;
  isINR: boolean;
}) {
  const fiveYearCost = isINR ? 44_495 : 495;
  const startingPrice = isINR ? 9999 : 149;

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-40 pb-20 text-center">
      {/* Countdown + Scarcity */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive/5 px-8 py-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
            </span>
            <span className="font-bold text-destructive text-sm uppercase tracking-wider">
              48-Hour Flash Sale — {DEALS_REMAINING} deals left
            </span>
          </div>
          <CountdownTimer />
        </div>
      </motion.div>

      {/* Headline */}
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 font-bold text-5xl text-foreground tracking-tight md:text-7xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Balancer>Pay Once. Post Forever.</Balancer>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Balancer>
          We&apos;re selling just 20 lifetime licenses to Delulu Social&apos;s
          unlimited plan. 2 are already gone. When the timer hits zero or the
          last deal sells — this page disappears.
        </Balancer>
      </motion.p>

      {/* Price anchor */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-muted-foreground text-sm">
          VIBE plan over 5 years:{" "}
          <span className="text-destructive line-through">
            {currencySymbol}
            {formatNum(fiveYearCost)}
          </span>
        </p>
        <p className="font-bold text-4xl text-foreground">
          From {currencySymbol}
          {formatNum(startingPrice)}
          <span className="ml-2 font-normal text-lg text-muted-foreground">
            one-time
          </span>
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Button asChild className="h-14 px-8 text-lg" size="lg">
          <Link href="#pricing">Grab the Lifetime Deal</Link>
        </Button>
        <p className="text-muted-foreground text-xs">
          One-time payment · No recurring charges · 60-day money-back guarantee
        </p>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Pricing Tiers
// ---------------------------------------------------------------------------

function PricingTiersSection({
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
  return (
    <section
      className="relative flex w-full flex-col items-center justify-center border-t"
      id="pricing"
    >
      <div className="relative mx-14 border-border border-x border-dashed">
        {/* Diagonal patterns */}
        <div className="absolute top-0 -left-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-left-14 md:w-14" />
        <div className="absolute top-0 -right-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-right-14 md:w-14" />

        <div className="h-full w-full border-border border-b py-16">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 font-bold text-4xl">
              <Balancer>
                Choose Your <span className="text-primary">Lifetime</span> Plan
              </Balancer>
            </h2>
            <p className="text-muted-foreground">
              One payment. Lifetime access. All future updates included.
            </p>
          </div>

          <LineSvg className="mb-2 h-px w-full" />

          <div className="mx-auto grid max-w-6xl gap-4 px-2 md:grid-cols-3">
            {LIFETIME_TIERS_UI.map((tier) => {
              const price = tier.price[currency];
              const perSeat =
                tier.seats > 1
                  ? `${currencySymbol}${formatNum(Math.round(price / tier.seats))}/seat`
                  : null;
              const monthlyEquiv = `= ${currencySymbol}${isINR ? Math.round(price / 60).toLocaleString("en-IN") : (price / 60).toFixed(2)}/mo over 5 years`;

              const features = [
                "Everything in VIBE plan",
                `${tier.seats} team seat${tier.seats > 1 ? "s" : ""}`,
                "Unlimited social accounts",
                "Unlimited posts",
                "Unlimited storage",
                "Priority support",
                "1,000 free transcriptions",
                "All future updates",
                "No recurring fees",
              ];

              return (
                <div
                  className={cn(
                    "relative flex flex-col gap-3 rounded-[37px] p-4",
                    tier.highlighted
                      ? "border border-primary bg-gradient-to-b from-primary/20 via-primary/10 to-primary/5"
                      : "bg-card"
                  )}
                  key={tier.name}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 font-semibold text-primary-foreground text-xs">
                      BEST VALUE
                    </div>
                  )}

                  <div className="space-y-8 rounded-[28px] bg-background p-4 px-4 pb-20 shadow-lg">
                    <div className="flex flex-col">
                      <div className="space-y-2">
                        <h3 className="flex w-fit items-center justify-center rounded-full border bg-background px-4 py-1 font-medium text-lg">
                          {tier.name}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {tier.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-baseline">
                        <span className="font-bold text-4xl">
                          {currencySymbol}
                        </span>
                        <span className="font-bold text-4xl">
                          {formatNum(price)}
                        </span>
                        <span className="ml-1 text-muted-foreground">
                          /lifetime
                        </span>
                      </div>

                      {perSeat && (
                        <p className="mt-1 font-medium text-primary text-sm">
                          {perSeat}
                        </p>
                      )}
                      <p className="mt-1 text-muted-foreground text-xs">
                        {monthlyEquiv}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="w-full px-6 py-4 font-medium text-md"
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      <Link href={SIGN_IN_URL}>Get {tier.name}</Link>
                    </Button>

                    <ul className="space-y-4">
                      {features.map((feature) => (
                        <li className="flex items-center" key={feature}>
                          <CheckIcon highlighted={tier.highlighted} />
                          <span className="text-muted-foreground text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <LineSvg className="mt-2 h-px w-full" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 3: What You're Getting
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  publish: (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  dm: (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  team: (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  bonus: (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function FeaturesSection() {
  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl">
            What You&apos;re <span className="text-primary">Getting</span>
          </h2>
          <p className="text-muted-foreground">
            Everything you need to dominate social media — included forever.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {FEATURE_CATEGORIES.map((category) => (
            <div
              className="rounded-xl border bg-card p-6 transition-colors hover:bg-card/80"
              key={category.title}
            >
              <div className="mb-4 flex items-center gap-3">
                {CATEGORY_ICONS[category.icon]}
                <h3 className="font-semibold text-foreground text-lg">
                  {category.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {category.features.map((feature) => (
                  <li className="flex items-start gap-2" key={feature}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
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
  const deluluPrice = LIFETIME_TIERS[0].price[currency]; // Solo tier

  return (
    <section className="w-full border-t py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl">
            How Delulu <span className="text-primary">Stacks Up</span>
          </h2>
          <p className="text-muted-foreground">
            Compare what you&apos;d pay over 5 years. Spoiler: it&apos;s not
            even close.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 font-medium text-muted-foreground" />
                {COMPETITORS.map((c) => (
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    key={c.name}
                  >
                    {c.name}
                  </th>
                ))}
                <th className="rounded-t-lg bg-primary/5 px-4 py-3 font-semibold text-primary">
                  Delulu LTD
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium text-foreground">
                  Monthly price
                </td>
                {COMPETITORS.map((c) => (
                  <td className="px-4 py-3 text-muted-foreground" key={c.name}>
                    ${c.monthly}/mo
                  </td>
                ))}
                <td className="bg-primary/5 px-4 py-3 font-semibold text-primary">
                  {currencySymbol}
                  {formatNum(deluluPrice)} once
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium text-foreground">
                  5-year cost
                </td>
                {COMPETITORS.map((c) => (
                  <td className="px-4 py-3 text-muted-foreground" key={c.name}>
                    ${(c.monthly * 60).toLocaleString()}
                  </td>
                ))}
                <td className="bg-primary/5 px-4 py-3 font-semibold text-primary">
                  {currencySymbol}
                  {formatNum(deluluPrice)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium text-foreground">
                  Platforms
                </td>
                {COMPETITORS.map((c) => (
                  <td className="px-4 py-3 text-muted-foreground" key={c.name}>
                    {c.platforms}
                  </td>
                ))}
                <td className="bg-primary/5 px-4 py-3 font-semibold text-primary">
                  8+
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium text-foreground">
                  DM Automation
                </td>
                {COMPETITORS.map((c) => (
                  <td className="px-4 py-3" key={c.name}>
                    {c.dms ? (
                      <Check className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </td>
                ))}
                <td className="bg-primary/5 px-4 py-3">
                  <Check className="h-4 w-4 text-primary" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium text-foreground">
                  Scheduling
                </td>
                {COMPETITORS.map((c) => (
                  <td className="px-4 py-3" key={c.name}>
                    {c.scheduling ? (
                      <Check className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </td>
                ))}
                <td className="bg-primary/5 px-4 py-3">
                  <Check className="h-4 w-4 text-primary" />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Team seats
                </td>
                {COMPETITORS.map((c) => (
                  <td className="px-4 py-3 text-muted-foreground" key={c.name}>
                    {c.seats}
                  </td>
                ))}
                <td className="rounded-b-lg bg-primary/5 px-4 py-3 font-semibold text-primary">
                  Up to 5
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            You&apos;d spend{" "}
            <span className="font-semibold text-foreground">$5,940</span> on
            Hootsuite over 5 years. Or{" "}
            <span className="font-semibold text-primary">
              {currencySymbol}
              {formatNum(deluluPrice)}
            </span>{" "}
            once on Delulu. Your call.
          </p>
        </div>
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
    <section className="w-full py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-semibold text-4xl">
            Got <span className="text-primary">questions</span>?
          </h2>
          <p className="mx-auto max-w-3xl text-muted-foreground">
            Here are the answers you need before pulling the trigger:
          </p>
        </div>

        <div className="space-y-4 rounded-[22px] bg-muted p-4">
          {faqs.map((faq, index) => (
            <div
              className="overflow-hidden rounded-[17px] border bg-gradient-to-b from-card via-background to-card shadow-lg"
              key={index}
            >
              <button
                className="flex w-full items-center gap-2 px-6 py-5 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                type="button"
              >
                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Plus className="text-primary" size={20} />
                </motion.div>
                <span className="text-foreground text-lg">{faq.question}</span>
              </button>
              <AnimatePresence mode="sync">
                {openIndex === index && (
                  <motion.div
                    animate="open"
                    className="overflow-hidden px-6"
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
                    <div className="pb-5">
                      <p className="whitespace-pre-line text-muted-foreground">
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
  const soloPrice = LIFETIME_TIERS[0].price[currency];

  return (
    <section className="relative flex w-full flex-col items-center justify-center border-t">
      <div className="relative mx-14 border-border border-x border-dashed">
        <div className="absolute top-0 -left-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-left-14 md:w-14" />
        <div className="absolute top-0 -right-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-right-14 md:w-14" />

        <div className="relative h-full w-full border-border border-b py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-6 font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>Stop Paying Monthly. Own It Forever.</Balancer>
            </h2>

            <p className="mb-8 text-muted-foreground">
              From{" "}
              <span className="font-bold text-2xl text-foreground">
                {currencySymbol}
                {formatNum(soloPrice)}
              </span>{" "}
              one-time — that&apos;s less than 2 months of Hootsuite.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                  </span>
                  <span className="font-bold text-destructive text-xs uppercase tracking-wider">
                    {DEALS_REMAINING} of 20 deals remaining
                  </span>
                </div>
                <CountdownTimer />
              </div>

              <Button asChild className="h-14 px-8 text-lg" size="lg">
                <Link href="#pricing">Get Lifetime Access</Link>
              </Button>

              <p className="text-muted-foreground text-xs">
                60-day money-back guarantee · One-time payment · Instant access
              </p>
            </div>
          </div>

          {/* Canvas Effect */}
          <div className="absolute bottom-0 left-1/2 -z-10 mx-auto flex w-full max-w-3xl -translate-x-1/2 items-center justify-center rounded-full">
            <CanvasRevealEffect
              animationSpeed={1}
              colors={[[255, 107, 43]]}
              dotSize={3}
            />
            <div className="absolute inset-0 h-full bg-radial/[in_oklch] from-background/80 via-background/90 to-background" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export default function Lifetime() {
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
      <PricingTiersSection
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
