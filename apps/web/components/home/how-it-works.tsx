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

const steps = [
  {
    number: 1,
    image: "/images/delulu/calendar.png",
    title: "Schedule your posts",
    description:
      "Write once. Pick your platforms \u2014 Instagram, TikTok, LinkedIn, YouTube, and more. Hit schedule. Delulu posts it everywhere at the perfect time.",
  },
  {
    number: 2,
    image: "/images/delulu/happy.png",
    title: "Set a keyword trigger",
    description:
      "Pick a keyword like \u201cLINK\u201d or \u201cINFO\u201d. When someone comments it on your Instagram post, Delulu wakes up.",
  },
  {
    number: 3,
    image: "/images/delulu/win.png",
    title: "Comments become customers",
    description:
      "Delulu auto-sends them a DM with your link, replies to their comment publicly, and logs everything. You wake up to sales \u2014 not a to-do list.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="relative flex w-full flex-col items-center justify-center"
      id="how-it-works"
    >
      <div className="relative mx-14 border-border border-x border-dashed">
        {/* Left diagonal pattern */}
        <div className="absolute top-0 -left-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-left-14 md:w-14" />

        {/* Right diagonal pattern */}
        <div className="absolute top-0 -right-4 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:-right-14 md:w-14" />

        {/* Content */}
        <div className="h-full w-full border-border border-b py-10">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>How It Works</Balancer>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-8">
              <Balancer>
                Three steps. Five minutes. You're making money in your sleep.
              </Balancer>
            </p>
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Step Cards */}
          <div className="relative mx-auto grid grid-cols-1 gap-2 px-2 lg:max-w-none lg:grid-cols-3">
            {steps.map((step, index) => (
              <React.Fragment key={step.title}>
                <Card>
                  {/* Step Number + Mascot Image */}
                  <CardHeader className="relative mx-auto mb-6 flex size-60 items-center justify-center">
                    <div className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                      {step.number}
                    </div>
                    <Image
                      alt={step.title}
                      className="h-full w-full object-contain dark:invert"
                      height={300}
                      src={step.image}
                      width={300}
                    />
                  </CardHeader>

                  {/* Content */}
                  <CardContent>
                    <h3 className="mb-4 font-semibold text-foreground text-lg">
                      <Balancer>{step.title}</Balancer>
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6">
                      <Balancer>{step.description}</Balancer>
                    </p>
                  </CardContent>
                </Card>

                {/* Responsive separators between cards */}
                {index < steps.length - 1 && (
                  <>
                    {/* Mobile: horizontal line between cards */}
                    <LineSvg className="my-4 h-px w-full lg:hidden" />

                    {/* Desktop: vertical line between cards */}
                    <LineSvg
                      className={`absolute -top-2 hidden h-[calc(100%+1rem)] w-px lg:block ${index === 0 ? "left-[calc(33.333%+1px)]" : "left-[calc(66.666%-2px)]"}`}
                      direction="vertical"
                    />
                  </>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Line below cards */}
          <LineSvg className="mt-2 h-px w-full" />

          {/* Bottom line */}
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <p className="font-medium text-foreground text-xl">
              <Balancer>
                That's it. No complicated setup. No $67/mo DM tool. No separate
                scheduler.
              </Balancer>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
