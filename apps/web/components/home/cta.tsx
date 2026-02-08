"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@delulu/design-system/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import LineSvg from "@/components/ui/line-svg";

export const ctaBenefitsData = [
  {
    id: "schedule-automate",
    image: "/images/delulu/coin-flip.png",
    alt: "Delulu flipping a coin",
    title: "Schedule + Automate",
    description:
      "Post across 8 platforms and auto-DM every lead. One tool does what two couldn\u2019t.",
    imageWidth: "w-24 md:w-28",
  },
  {
    id: "save-money",
    image: "/images/delulu/control.png",
    alt: "Delulu with checklist",
    title: "Save $72/mo",
    description: "Replace your scheduler AND your DM tool. Keep $864/year.",
    imageWidth: "w-40",
  },
  {
    id: "ship-fast",
    image: "/images/delulu/coffee.png",
    alt: "Happy delulu with coffee",
    title: "Live in 15 Minutes",
    description:
      "Connect your accounts, schedule a week of posts, set up your first keyword trigger. Done before your coffee gets cold.",
    imageWidth: "w-24 md:w-28",
  },
];

const CTA = () => {
  const benefits = ctaBenefitsData;

  return (
    <section className="relative flex w-full flex-col items-center justify-center border-t">
      <div className="relative mx-14 border-border border-x border-dashed">
        {/* Left diagonal pattern */}
        <div className="absolute top-0 -left-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-left-14 md:w-14" />

        {/* Right diagonal pattern */}
        <div className="absolute top-0 -right-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-right-14 md:w-14" />

        {/* Content */}
        <div className="relative h-full w-full border-border border-b py-10">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>
                You're Posting Without Selling. Let's Fix That.
              </Balancer>
            </h2>
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Benefits Grid */}
          <div className="relative mx-auto grid gap-2 px-2 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card
                className="group relative transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-lg"
                key={benefit.id}
              >
                <CardHeader className="relative mx-auto mb-2 flex size-30 items-center justify-center">
                  <Image
                    alt={benefit.alt}
                    className={`h-auto ${benefit.imageWidth} dark:invert`}
                    height={120}
                    src={benefit.image}
                    width={120}
                  />
                </CardHeader>
                <CardContent className="text-center">
                  <h3 className="mb-3 font-semibold text-base text-foreground">
                    <Balancer>{benefit.title}</Balancer>
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6">
                    <Balancer>{benefit.description}</Balancer>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Line below cards */}
          <LineSvg className="mt-2 h-px w-full" />

          {/* Bottom CTA */}
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <div className="flex flex-col items-center gap-4">
              {/* Urgency Messaging */}
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    fillRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-foreground text-xs">
                  Lock in current pricing · Limited to 50 early adopters
                </span>
              </div>

              <Button asChild className="h-14 px-8 text-lg" size="lg">
                <Link href="https://solulu.delulu.social/sign-in">
                  Start free — cancel anytime
                </Link>
              </Button>

              <p className="text-muted-foreground text-xs">
                No credit card required · Cancel anytime
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
};

export default CTA;
