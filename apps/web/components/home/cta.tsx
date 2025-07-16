'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import Link from 'next/link';
import { FaClock, FaComments, FaMagic } from 'react-icons/fa';
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';

const CTA = () => {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-24">
      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center text-center">
        <h1 className="mb-8 font-bold text-4xl leading-tight md:text-5xl lg:text-6xl">
          Only <span className="text-primary">100 Slots</span> at $1/Month
          <br />
          for a Year—Then It's Gone Forever
        </h1>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-sm">
            <FaClock className="h-8 w-8 text-primary" />
            <p className="text-muted-foreground">
              If you don't save 5 hours in your first 30 days, we refund your $1
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-sm">
            <FaComments className="h-8 w-8 text-primary" />
            <p className="text-muted-foreground">
              Your feedback shapes every feature until we hit full launch
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-sm">
            <FaMagic className="h-8 w-8 text-primary" />
            <p className="text-muted-foreground">
              One-click scheduling, zero headaches
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button size="lg" className="h-14 px-8 text-lg" asChild>
            <Link href="/signup">Claim Your Early-Stage Spot at $1/Month</Link>
          </Button>
          <p className="text-muted-foreground text-sm">
            Use Code:{' '}
            <span className="font-bold font-mono text-primary">FIRST100</span>
          </p>
        </div>

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
  );
};

export default CTA;
