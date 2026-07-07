import { getProductIds } from "@delulu/payments/product-ids";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { PricingCards } from "@/components/billing/pricing-cards";
import { useCurrency } from "@/hooks/use-currency";

export function PricingStep() {
  const currency = useCurrency();
  const productIds = getProductIds(currency);
  const [checkoutReturnUrl, setCheckoutReturnUrl] = useState<string>();

  useEffect(() => {
    setCheckoutReturnUrl(`${window.location.origin}/onboarding`);
  }, []);

  return (
    <div className="space-y-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
        initial={{ opacity: 0, y: 10 }}
      >
        <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="text-lg text-muted-foreground tracking-tight">
          Pick Echo or Vibe to unlock scheduling and auto-DMs. 14-day
          money-back guarantee.
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <PricingCards
          checkoutReturnUrl={checkoutReturnUrl}
          productIds={productIds}
        />
      </motion.div>
    </div>
  );
}
