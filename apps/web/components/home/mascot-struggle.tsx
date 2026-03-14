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

export function MascotStruggle() {
  const struggles = [
    {
      image: "/images/delulu/drowing-in-tabs.png",
      title: "You post daily but your growth is flat.",
      description:
        "You're creating content, showing up, doing everything right. But turning viewers into loyal followers? That's a whole different game \u2014 and it's eating your time.",
    },
    {
      image: "/images/delulu/socials.png",
      title: "Comments = followers you're losing.",
      description:
        'Someone comments "Love this!" or "Send me the link!" on your post. By the time you see it, they\'ve scrolled past. Every missed comment is a missed connection.',
    },
    {
      image: "/images/delulu/laptop.png",
      title: "Copy-paste-post across 6 apps.",
      description:
        "Instagram, TikTok, LinkedIn, YouTube \u2014 each one needs different formatting. Your \u201cquick post\u201d just became an hour-long chore. And none of it drives real engagement.",
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
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>Sound familiar?</Balancer>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-8">
              <Balancer>
                The daily grind of every creator trying to grow on Instagram:
              </Balancer>
            </p>
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Struggle Cards */}
          <div className="relative mx-auto grid grid-cols-1 gap-2 px-2 lg:max-w-none lg:grid-cols-3">
            {struggles.map((struggle, index) => (
              <React.Fragment key={struggle.title}>
                <Card key={struggle.title}>
                  {/* Mascot Image */}
                  <CardHeader className="relative mx-auto mb-6 flex size-60 items-center justify-center">
                    <Image
                      alt={struggle.title}
                      className="h-full w-full object-contain dark:invert"
                      height={300}
                      key={struggle.title}
                      src={struggle.image}
                      width={300}
                    />
                  </CardHeader>

                  {/* Content */}
                  <CardContent>
                    <h3 className="mb-4 font-semibold text-foreground text-lg">
                      <Balancer>{struggle.title}</Balancer>
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6">
                      <Balancer>{struggle.description}</Balancer>
                    </p>
                  </CardContent>
                </Card>

                {/* Responsive separators between cards */}
                {index < struggles.length - 1 && (
                  <>
                    {/* Mobile: horizontal line between cards */}
                    <LineSvg className="my-4 h-px w-full lg:hidden" />

                    {/* Desktop: vertical line between cards - centered in gap */}
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

          {/* Bottom CTA */}
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <p className="font-medium text-foreground text-xl">
              <Balancer>
                What if posting and growing happened automatically? (It does
                now.)
              </Balancer>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
