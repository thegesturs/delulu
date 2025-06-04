'use client';
import { cn } from '@delulu/design-system/lib/utils';
import { motion, useAnimation, useInView } from 'motion/react';
import React, { useEffect } from 'react';
import { CanvasRevealEffect } from './ui/canvas-reveal-effect';
interface FeatureCard {
  percentage: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    percentage: '19.4%',
    description: 'Cheaper than competitors',
  },
  {
    percentage: '40%',
    description: 'Less load consumption',
  },
  {
    percentage: '32%',
    description: 'Times nobody picks up your calls',
  },
  {
    percentage: '94.32%',
    description: 'Uptime guaranteed lol',
  },
];

export function Features() {
  return (
    <div className="relative w-full py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 font-bold text-4xl">
          Scale with <span className="text-[oklch(0.65_0.25_30)]">NO</span>{' '}
          issues
        </h2>
        <p className="mx-4 text-muted-foreground">
          Shape AI can handle load times upto 99.99% of the times, the rest of
          the times GOD is against us.
        </p>
      </div>

      <div
        style={{ zIndex: 10 }}
        className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              'relative rounded-xl border border-gray-200 bg-background/50 p-6 backdrop-blur-sm',
              'transition-discrete hover:shadow-xl',
              'before:-translate-x-1/2 before:absolute before:top-0 before:left-1/2 before:h-[2px] before:w-12',
              'from-[oklch(0.65_0.25_30)] to-[oklch(0.75_0.15_30)] before:bg-linear-to-r/[in_oklch]',
              'inset-shadow-sm'
            )}
          >
            <BackgroundGrid className="absolute inset-0 z-0 rounded-xl" />
            <div className="absolute inset-0 z-0 h-full rounded-xl bg-radial/[in_oklch] from-white/50 via-white/60 to-white" />
            <div className="relative">
              <h3 className="mb-2 font-bold text-4xl">{feature.percentage}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="-translate-x-1/2 absolute bottom-0 left-1/2 mx-auto w-full max-w-3xl rounded-full">
        <CanvasRevealEffect
          colors={[[255, 107, 43]]}
          dotSize={3}
          animationSpeed={1}
        />
        <div className="absolute inset-0 z-10 h-full bg-radial/[in_oklch] from-white/80 via-white/90 to-white" />
      </div>
    </div>
  );
}

const BackgroundGrid = ({ className }: { className?: string }) => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const inView = useInView(ref, { amount: 0.3, once: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 1 },
      });
    }
  }, [controls, inView]);

  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={{
        backgroundImage: `
          linear-gradient(to right, #e5e5e5 1px, transparent 1px),
          linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={controls}
        className="absolute h-full w-full"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute inset-0"
        />
      </motion.div>
    </div>
  );
};
