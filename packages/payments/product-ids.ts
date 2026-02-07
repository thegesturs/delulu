/**
 * Dodo Payments Product IDs Configuration
 *
 * Maps plan types and billing periods to Dodo product IDs.
 * Supports different IDs for test_mode and production environments.
 */

import type { PlanType } from "./plans";

export interface ProductIdConfig {
  monthly: string;
  yearly: string;
}

/**
 * Test Mode Product IDs (for development/staging)
 */
export const TEST_PRODUCT_IDS: Record<
  Exclude<PlanType, "FREE">,
  ProductIdConfig
> = {
  VIBE: {
    monthly: "pdt_mPTd8gsQS8YUISdStWURf", // $9.99/month (test)
    yearly: "pdt_naiOlQemBRKGOVNKR8qmA", // $99/year (test)
  },
  ECHO: {
    monthly: "pdt_Wy6tQl25lVbD2mB7otYZk", // $4.99/month (test)
    yearly: "pdt_Si8ICePOeVze97OIO8kCh", // $49/year (test)
  },
};

/**
 * Production Product IDs
 */
export const PROD_PRODUCT_IDS: Record<
  Exclude<PlanType, "FREE">,
  ProductIdConfig
> = {
  VIBE: {
    monthly: "pdt_tbJH22RAmI1RSPWl9ZtZd", // $9.90/month (prod)
    yearly: "pdt_4iLNFL4WpmxdCAXIXVEkm", // $99.0/year (prod)
  },
  ECHO: {
    monthly: "pdt_uOWl8h66nIVB570LbddrA", // $4.99/month (prod)
    yearly: "pdt_LA4GUsC2joUtFdLnZLZeP", // $49.00/year (prod)
  },
};

/**
 * Get product IDs based on environment
 * Checks DODO_PAYMENTS_ENVIRONMENT to determine which set to use
 */
export function getProductIds(): Record<
  Exclude<PlanType, "FREE">,
  ProductIdConfig
> {
  const env = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  return env === "live_mode" ? PROD_PRODUCT_IDS : TEST_PRODUCT_IDS;
}

/**
 * Get product ID for a specific plan and billing period
 */
export function getProductId(
  planType: Exclude<PlanType, "FREE">,
  billingPeriod: "MONTHLY" | "YEARLY"
): string {
  const productIds = getProductIds();
  return billingPeriod === "MONTHLY"
    ? productIds[planType].monthly
    : productIds[planType].yearly;
}

/**
 * Map product ID back to plan type and billing period
 * Supports both test and production IDs
 */
export function getPlanFromProductId(productId: string): {
  planType: Exclude<PlanType, "FREE">;
  billingPeriod: "MONTHLY" | "YEARLY";
} | null {
  // Check test IDs
  for (const [plan, ids] of Object.entries(TEST_PRODUCT_IDS)) {
    if (ids.monthly === productId) {
      return {
        planType: plan as Exclude<PlanType, "FREE">,
        billingPeriod: "MONTHLY",
      };
    }
    if (ids.yearly === productId) {
      return {
        planType: plan as Exclude<PlanType, "FREE">,
        billingPeriod: "YEARLY",
      };
    }
  }

  // Check prod IDs
  for (const [plan, ids] of Object.entries(PROD_PRODUCT_IDS)) {
    if (ids.monthly === productId) {
      return {
        planType: plan as Exclude<PlanType, "FREE">,
        billingPeriod: "MONTHLY",
      };
    }
    if (ids.yearly === productId) {
      return {
        planType: plan as Exclude<PlanType, "FREE">,
        billingPeriod: "YEARLY",
      };
    }
  }

  return null;
}

/**
 * Get all product IDs as a flat array (useful for validation)
 */
export function getAllProductIds(): string[] {
  return [
    ...Object.values(TEST_PRODUCT_IDS).flatMap((ids) => [
      ids.monthly,
      ids.yearly,
    ]),
    ...Object.values(PROD_PRODUCT_IDS).flatMap((ids) => [
      ids.monthly,
      ids.yearly,
    ]),
  ];
}
