"use client";
import { cn } from "@delulu/design-system/lib/utils";
import { motion, useAnimation, useInView } from "motion/react";
import Link from "next/link";
import React, { useEffect } from "react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

interface FeatureCard {
  percentage: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    percentage: "47%",
    description: "Time saved on reformatting content for different platforms",
  },
  {
    percentage: "3.5x",
    description: "Faster publishing across multiple social channels",
  },
  {
    percentage: "89%",
    description: "Users report improved content consistency",
  },
  {
    percentage: "24h",
    description: "Average time saved per week on content scheduling",
  },
];

export function Features() {
  return (
    <div className="relative w-full py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 font-bold text-4xl text-foreground">
          We Know How <span className="text-primary">Messy</span> It Can Be
        </h2>
        <p className="mx-4 text-muted-foreground">
          Why Scheduling Matters for Your Content Strategy
        </p>
      </div>

      <div
        className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-4"
        style={{ zIndex: 10 }}
      >
        {features.map((feature, index) => (
          <div
            className={cn(
              "relative rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm",
              "transition-all hover:shadow-xl",
              "before:absolute before:top-0 before:left-1/2 before:h-[2px] before:w-12 before:-translate-x-1/2",
              "before:bg-gradient-to-r before:from-primary/60 before:to-primary",
              "shadow-sm"
            )}
            key={index}
          >
            <BackgroundGrid className="absolute inset-0 z-0 rounded-xl" />
            <div className="absolute inset-0 z-0 h-full rounded-xl bg-gradient-to-b from-background/50 via-background/60 to-background" />
            <div className="relative">
              <h3 className="mb-2 font-bold text-4xl text-foreground">
                {feature.percentage}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          className="inline-block font-medium text-primary hover:text-primary/90"
          href="#features"
        >
          See How One Click Works →
        </Link>
      </div>

      <div className="absolute bottom-0 left-1/2 mx-auto w-full max-w-3xl -translate-x-1/2 rounded-full">
        <CanvasRevealEffect
          animationSpeed={1}
          colors={[[255, 107, 43]]}
          dotSize={3}
        />
        <div className="absolute inset-0 z-10 h-full bg-gradient-to-b from-background/80 via-background/90 to-background" />
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
      className={cn("absolute inset-0 overflow-hidden", className)}
      ref={ref}
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      <motion.div
        animate={controls}
        className="absolute h-full w-full"
        initial={{ opacity: 0, scale: 0.8 }}
      >
        <motion.div
          animate={{ opacity: 0.2 }}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
    </div>
  );
};
