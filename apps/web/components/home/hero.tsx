"use client";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import { useTheme } from "@delulu/design-system";
import { Button } from "@delulu/design-system/components/ui/button";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useRef } from "react";
import Balancer from "react-wrap-balancer";
import { DesktopMockup } from "./desktop-mockup";
import { GradientBars } from "./gradient-bars";

const heroVariants = {
  outcome: {
    headline: "Every comment on your post can become a sale.",
    subtitle:
      "Delulu auto-DMs your link to anyone who comments a keyword \u2014 and schedules your posts across 8 platforms. One tool. $9.99/mo.",
    cta1: "Start free \u2014 no credit card",
    cta2: "See how it works",
  },
  pain: {
    headline: "You post every day. Your DMs are still empty.",
    subtitle:
      "Comments pile up. Leads go cold. You can\u2019t DM everyone manually. Delulu turns every comment into a DM conversation \u2014 automatically \u2014 while posting your content across 8 platforms.",
    cta1: "Fix my DMs \u2014 free",
    cta2: "See how it works",
  },
  identity: {
    headline: "Built for creators who sell, not just post.",
    subtitle:
      "Delulu isn\u2019t another scheduler. It posts your content across 8 platforms AND auto-DMs anyone who comments on your posts. Scheduling + sales. One tool. $9.99.",
    cta1: "Start free \u2014 no credit card",
    cta2: "See how it works",
  },
  curiosity: {
    headline: "What if every Instagram comment became a customer?",
    subtitle:
      "Someone comments on your post. Delulu instantly DMs them your link, replies to their comment, and logs the lead. Oh, and it also schedules your posts across 8 platforms. For $9.99/mo.",
    cta1: "Try it free",
    cta2: "See how it works",
  },
  direct: {
    headline: "Post everywhere. Auto-DM your buyers. $9.99.",
    subtitle:
      "Schedule across Instagram, TikTok, LinkedIn, YouTube, and 4 more \u2014 then turn every comment into a DM with your link. One dashboard. One tool that actually makes you money.",
    cta1: "Start free \u2014 no credit card",
    cta2: "See how it works",
  },
} as const;

type HeroVariantKey = keyof typeof heroVariants;

export function Hero() {
  const parentRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const image = isDark ? "/images/app-dark.png" : "/images/app-light.png";

  const posthog = useAnalytics();
  const flagValue = posthog?.getFeatureFlag("hero-variant");
  const variantKey: HeroVariantKey =
    typeof flagValue === "string" && flagValue in heroVariants
      ? (flagValue as HeroVariantKey)
      : "outcome";
  const variant = heroVariants[variantKey];

  return (
    <div
      className="relative mx-auto flex max-w-7xl flex-col items-center justify-center overflow-hidden px-4 pt-40 md:px-8"
      ref={parentRef}
    >
      {/* Shader Background */}
      <div className="absolute inset-0">
        <GradientBars
          bars={20}
          colors={[theme === "dark" ? "#818cf8" : "#4338ca", "transparent"]}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-4xl text-center">
        {/* Main Heading */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 font-bold text-5xl text-foreground tracking-tight md:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Balancer>{variant.headline}</Balancer>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Balancer>{variant.subtitle}</Balancer>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button asChild size="lg">
            <Link href="https://solulu.delulu.social/sign-in">
              {variant.cta1}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how-it-works">{variant.cta2}</Link>
          </Button>
        </motion.div>

        {/* Tiny Reassurance */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-16 max-w-md text-sm text-zinc-500"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Balancer>
            Chill. We don't spam. We don't sell your data. We don't even want
            your phone number — ew.
          </Balancer>
        </motion.p>
      </div>

      {/* App Preview */}
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 mb-[-100px] w-full max-w-5xl"
        initial={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <DesktopMockup>
          <Image
            alt="Delulu Social Dashboard"
            className="h-full w-full object-contain object-top"
            height={800}
            priority
            src={image}
            width={1200}
          />
          {/* Sarcastic Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-black/80 px-6 py-3 text-center text-white backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="font-medium text-lg">Look, mom, one click.</p>
            </motion.div>
          </div>
        </DesktopMockup>
      </motion.div>
    </div>
  );
}
