'use client';

import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';
import LineSvg from '@/components/ui/line-svg';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@delulu/design-system/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import Balancer from 'react-wrap-balancer';

// Example: You can export this data to use elsewhere
export const ctaBenefitsData = [
  {
    id: 'time-value',
    image: '/images/delulu/coin-flip.png',
    alt: 'Delulu flipping a coin',
    title: 'Your Time > $1',
    description:
      "If Delulu doesn't save you at least 5 hours this month, I'll toss your dollar back. Congrats, you just bought a latte with zero effort.",
    imageWidth: 'w-24 md:w-28',
  },
  {
    id: 'user-control',
    image: '/images/delulu/control.png',
    alt: 'Delulu with checklist',
    title: 'You Call the Shots',
    description:
      'The first 100 aren\'t "beta testers." You\'re literally steering what gets built. Delulu listens. Delulu ships.',
    imageWidth: 'w-40',
  },
  {
    id: 'one-click',
    image: '/images/delulu/coffee.png',
    alt: 'Happy delulu with coffee',
    title: 'Zero Chaos, One Click',
    description:
      'Scheduling everywhere with one click = no more tab-hopping, no more missed posts, no more forehead dents from facepalming at your laptop.',
    imageWidth: 'w-24 md:w-28',
  },
];

const CTA = () => {
  // Using the exported data - you can now use this anywhere
  const benefits = ctaBenefitsData;

  return (
    <section className="relative flex w-full flex-col items-center justify-center border-t">
      <div className="relative mx-14 border-border border-x border-dashed ">
        {/* Left diagonal pattern */}
        <div className="-left-4 md:-left-14 absolute top-0 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:w-14" />

        {/* Right diagonal pattern */}
        <div className="-right-4 md:-right-14 absolute top-0 h-full w-4 bg-[size:10px_10px] text-primary/5 [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)] md:w-14" />

        {/* Content */}
        <div className="relative h-full w-full border-border border-b py-10">
          {/* Section Header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
              <Balancer>
                <span className="text-primary">$1</span> to join. You + 99
                others get to boss Delulu around.
              </Balancer>
            </h2>

            {/* Delulu Mascot Section */}
            {/* <div className="mt-8 flex flex-col items-center gap-4">
              <Image
                src="/images/delulu/coin-flip.png"
                alt="Delulu flipping a coin - dollar back guarantee"
                width={120}
                height={120}
                className="h-auto w-20 md:w-24 dark:invert"
              />
              <p className="text-lg text-muted-foreground leading-8">
                <Balancer>
                  If this doesn’t save you 5+ hours, we’ll hand back your
                  dollar. Congrats, you just funded your next latte
                </Balancer>
              </p>
            </div> */}
          </div>

          {/* Line above cards */}
          <LineSvg className="mb-2 h-px w-full" />

          {/* Benefits Grid */}
          <div className="relative mx-auto grid gap-2 px-2 md:grid-cols-3">
            {benefits.map((benefit, _index) => (
              <Card
                key={benefit.id}
                className="group relative transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-lg"
              >
                <CardHeader className="relative mx-auto mb-2 flex size-30 items-center justify-center">
                  <Image
                    src={benefit.image}
                    alt={benefit.alt}
                    width={120}
                    height={120}
                    className={`h-auto ${benefit.imageWidth} dark:invert`}
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
              <Button size="lg" className="h-14 px-8 text-lg" asChild>
                <Link href="https://solulu.delulu.social/sign-in">
                  👉 I'll Risk My $1
                </Link>
              </Button>
              <p className="text-muted-foreground text-sm">
                Code:{' '}
                <span className="font-bold font-mono text-primary">
                  FIRST100
                </span>{' '}
                · One-time deal · Delulu won't let you in later
              </p>
            </div>
          </div>

          {/* Canvas Effect */}
          <div className="-translate-x-1/2 -z-10 absolute bottom-0 left-1/2 mx-auto flex w-full max-w-3xl items-center justify-center rounded-full">
            <CanvasRevealEffect
              colors={[[255, 107, 43]]}
              dotSize={3}
              animationSpeed={1}
            />
            <div className="absolute inset-0 h-full bg-radial/[in_oklch] from-background/80 via-background/90 to-background" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
