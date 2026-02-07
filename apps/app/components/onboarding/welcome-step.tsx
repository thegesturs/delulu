import { Icon } from "@delulu/design-system/providers/icon";
import {
  BarChartIcon,
  Calendar01Icon,
  NeuralNetworkIcon,
  Sent02Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function WelcomeStep() {
  return (
    <div className="space-y-8 text-center">
      {/* Hero Section */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          Welcome to Delulu Social
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage all your social media from one place
        </p>
      </motion.div>

      {/* Benefits Grid */}
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <BenefitCard
          delay={0.1}
          description="Create content once, publish everywhere"
          icon={<Icon icon={Sent02Icon} size={24} />}
          title="Multi-Platform Posting"
        />
        <BenefitCard
          delay={0.15}
          description="Plan and schedule posts in advance"
          icon={<Icon icon={Calendar01Icon} size={24} />}
          title="Smart Scheduling"
        />
        <BenefitCard
          delay={0.2}
          description="Track performance across all platforms"
          icon={<Icon icon={BarChartIcon} size={24} />}
          title="Analytics Dashboard"
        />
        <BenefitCard
          delay={0.25}
          description="Work together with your team in real-time"
          icon={<Icon icon={NeuralNetworkIcon} size={24} />}
          title="Team Collaboration"
        />
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col items-center space-y-3 rounded-lg border bg-card p-6 text-card-foreground transition-colors hover:bg-accent/50"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
