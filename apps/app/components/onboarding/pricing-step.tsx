import { motion } from "motion/react";
import { PricingCards } from "@/components/billing/pricing-cards";

export function PricingStep() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
        initial={{ opacity: 0, y: 10 }}
      >
        <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="text-lg text-muted-foreground tracking-tight">
          Start with our free plan or upgrade anytime
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <PricingCards />
      </motion.div>
    </div>
  );
}
