"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@delulu/design-system/components/ui/card";
import Image from "next/image";
import React from "react";
import Balancer from "react-wrap-balancer";
import LineSvg from "@/components/ui/line-svg";
import { useCurrency } from "@/hooks/use-currency";

export function MascotBenefits() {
  const currency = useCurrency();
  const isINR = currency === "INR";
  // Our price changes; competitor prices (Buffer, ManyChat) stay in USD
  const deluluPrice = isINR ? "\u20B9899" : "$9.99";
  const savings = isINR ? "\u20B9899" : "$72";
  const savingsYearly = isINR ? "\u20B910,788" : "$864";

  const benefits = [
    {
      image: "/images/delulu/calendar.png",
      title: "Post everywhere, once.",
      subtitle: "8 platforms. One click. Zero reformatting.",
      description:
        "Instagram, TikTok, LinkedIn, YouTube, Facebook, Pinterest, Threads \u2014 write once, we handle the rest. Schedule a week of content in 15 minutes.",
      badge: "Superpower #1",
    },
    {
      image: "/images/delulu/happy.png",
      title: "Comments \u2192 DMs \u2192 Sales.",
      subtitle: "Your posts sell while you sleep.",
      description:
        "Set a keyword trigger. When someone comments it, Delulu sends them a DM with your link and replies to their comment. The leads come to you.",
      badge: "Superpower #2",
    },
    {
      image: "/images/delulu/shill.png",
      title: `Save ${savings} every month.`,
      subtitle: `Buffer ($15) + ManyChat ($67) = $82. Delulu = ${deluluPrice}.`,
      description: `That\u2019s ${savingsYearly}/year back in your pocket. Most creators don\u2019t even realize they\u2019re overpaying \u2014 or doing it all manually for free and losing sales.`,
      badge: "The Math",
    },
    {
      image: "/images/delulu/win.png",
      title: "All your chaos, one dashboard.",
      subtitle: "Posts, DM automations, accounts \u2014 one login.",
      description:
        "No more switching between apps. Your scheduled posts, comment triggers, and connected accounts all live in one place.",
      badge: "CEO Mode",
    },
  ];

  return (
    <section className="relative flex w-full flex-col items-center justify-center">
      <div className="relative mx-14 border-border border-x border-dashed">
        {/* Left diagonal pattern */}
        <div className="absolute top-0 -left-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-left-14 md:w-14" />

        {/* Right diagonal pattern */}
        <div className="absolute top-0 -right-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-right-14 md:w-14" />

        {/* Content */}
        <div className="h-full w-full border-border border-b py-10">
          {/* Section Header */}
          <div className="mx-auto mb-20 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>One Tool. Two Superpowers.</Balancer>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-8">
              <Balancer>Schedule everywhere. Sell on autopilot.</Balancer>
            </p>
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Benefits Grid */}
          <div className="relative mx-auto grid max-w-2xl grid-cols-1 gap-2 px-2 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {benefits.map((benefit, index) => (
              <React.Fragment key={benefit.title}>
                <Card
                  className="group relative transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-lg"
                  key={benefit.title}
                >
                  {/* Mascot Image */}
                  <CardHeader className="relative mx-auto mb-6 flex size-60 items-center justify-center lg:mx-0">
                    <Image
                      alt={benefit.title}
                      className="h-full w-full object-contain dark:invert"
                      height={128}
                      src={benefit.image}
                      width={128}
                    />
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="text-center lg:text-left">
                    <div className="mb-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
                        {benefit.badge}
                      </span>
                    </div>

                    <h3 className="mb-2 font-bold text-foreground text-xl">
                      <Balancer>{benefit.title}</Balancer>
                    </h3>

                    <p className="mb-3 font-medium text-base text-primary">
                      <Balancer>{benefit.subtitle}</Balancer>
                    </p>

                    <p className="text-muted-foreground text-sm leading-6">
                      <Balancer>{benefit.description}</Balancer>
                    </p>
                  </CardContent>
                </Card>

                {/* Responsive separators between cards */}
                {index < benefits.length - 1 && (
                  <>
                    {/* Mobile: horizontal line between cards */}
                    <LineSvg className="my-4 h-px w-full lg:hidden" />
                  </>
                )}

                {/* Desktop: vertical line between columns (after cards 0,2) */}
                {(index === 0 || index === 2) && (
                  <LineSvg
                    className="absolute -top-2 left-1/2 hidden h-[calc(100%+1rem)] w-px lg:block"
                    direction="vertical"
                  />
                )}

                {/* Desktop: horizontal line between rows (after card 1) */}
                {index === 1 && (
                  <LineSvg className="absolute top-1/2 left-0 hidden h-px w-full lg:block" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Line below cards */}
          <LineSvg className="mt-2 h-px w-full" />

          {/* Bottom Quote */}
          <div className="mx-auto mt-20 max-w-3xl text-center">
            <blockquote className="font-medium text-foreground text-xl">
              <Balancer>
                "The tool that posts your content AND sells your product. For
                less than a latte."
              </Balancer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
