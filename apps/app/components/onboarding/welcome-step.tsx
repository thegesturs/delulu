import { Icon } from '@delulu/design-system/providers/icon';
import {
  BarChartIcon,
  Calendar01Icon,
  NeuralNetworkIcon,
  Sent02Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export function WelcomeStep() {
  return (
    <div className="space-y-8 text-center">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-2"
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
          icon={<Icon icon={Sent02Icon} size={24} />}
          title="Multi-Platform Posting"
          description="Create content once, publish everywhere"
          delay={0.1}
        />
        <BenefitCard
          icon={<Icon icon={Calendar01Icon} size={24} />}
          title="Smart Scheduling"
          description="Plan and schedule posts in advance"
          delay={0.15}
        />
        <BenefitCard
          icon={<Icon icon={BarChartIcon} size={24} />}
          title="Analytics Dashboard"
          description="Track performance across all platforms"
          delay={0.2}
        />
        <BenefitCard
          icon={<Icon icon={NeuralNetworkIcon} size={24} />}
          title="Team Collaboration"
          description="Work together with your team in real-time"
          delay={0.25}
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="group flex flex-col items-center space-y-3 rounded-lg border bg-card p-6 text-card-foreground transition-colors hover:bg-accent/50"
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
