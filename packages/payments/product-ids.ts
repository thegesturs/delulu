/**
 * Dodo Payments Product IDs Configuration
 *
 * Maps plan types and billing periods to Dodo product IDs.
 * Supports different IDs for test_mode and production environments.
 */

import type { CurrencyCode, PublicPlanType } from "./plans";

export interface ProductIdConfig {
  monthly: string;
  yearly: string;
}

/**
 * Test Mode Product IDs (for development/staging)
 */
export const TEST_PRODUCT_IDS: Record<PublicPlanType, ProductIdConfig> = {
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
export const PROD_PRODUCT_IDS: Record<PublicPlanType, ProductIdConfig> = {
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
 * Test Mode Product IDs for INR (India)
 */
export const TEST_PRODUCT_IDS_INR: Record<PublicPlanType, ProductIdConfig> = {
  VIBE: {
    monthly: "pdt_0NY399wZtyH8PLqVDYxu2", // ₹899/month (test)
    yearly: "pdt_0NY392AyfbiQoB7XCXrIj", // ₹8,899/year (test)
  },
  ECHO: {
    monthly: "pdt_0NY38Xmrynco8NzEON4FD", // ₹449/month (test)
    yearly: "pdt_0NY38rzJ2RhgwR1aVHsX0", // ₹4,499/year (test)
  },
};

/**
 * Production Product IDs for INR (India)
 */
export const PROD_PRODUCT_IDS_INR: Record<PublicPlanType, ProductIdConfig> = {
  VIBE: {
    monthly: "pdt_0NY399wZtyH8PLqVDYxu2", // ₹899/month (prod)
    yearly: "pdt_0NY392AyfbiQoB7XCXrIj", // ₹8,899/year (prod)
  },
  ECHO: {
    monthly: "pdt_0NY38Xmrynco8NzEON4FD", // ₹449/month (prod)
    yearly: "pdt_0NY38rzJ2RhgwR1aVHsX0", // ₹4,499/year (prod)
  },
};

// ============================================================================
// LIFETIME DEAL PRODUCT IDS (Solo — 1 seat, VIBE plan)
// ============================================================================

/**
 * TODO: Create one-time products on Dodo Payments dashboard and paste IDs here
 * Price: $149 USD / ₹9,999 INR — one-time payment
 */
export const LIFETIME_PRODUCT_IDS = {
  TEST_USD: "pdt_0NayEydz5jD8K8llxKwQT", // $149 one-time (test)
  PROD_USD: "pdt_0NayF5fo1lyODtIu9XgUQ", // $149 one-time (prod)
  TEST_INR: "pdt_0NayFFeCANGDldG7htrmu", // ₹13,999 one-time (test — same as prod)
  PROD_INR: "pdt_0NayFFeCANGDldG7htrmu", // ₹13,999 one-time (prod)
} as const;

/** All Lifetime product IDs for webhook matching */
export const ALL_LIFETIME_PRODUCT_IDS = Object.values(LIFETIME_PRODUCT_IDS);

/**
 * Check if a product ID is a lifetime deal product
 */
export function isLifetimeProductId(productId: string): boolean {
  return (ALL_LIFETIME_PRODUCT_IDS as readonly string[]).includes(productId);
}

/**
 * Get the lifetime product ID for the current environment and currency
 */
export function getLifetimeProductId(currency: CurrencyCode = "USD"): string {
  const env = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  if (currency === "INR") {
    return env === "live_mode"
      ? LIFETIME_PRODUCT_IDS.PROD_INR
      : LIFETIME_PRODUCT_IDS.TEST_INR;
  }
  return env === "live_mode"
    ? LIFETIME_PRODUCT_IDS.PROD_USD
    : LIFETIME_PRODUCT_IDS.TEST_USD;
}

/** Lifetime transcription limit (included free with LTD) */
export const LIFETIME_TRANSCRIPTION_LIMIT = 1000;

// ============================================================================
// SORTED EXTENSION PRODUCT IDS
// ============================================================================

/**
 * Sorted Extension Add-on Product IDs (metered, single product)
 */
export const SORTED_TEST_PRODUCT_ID = "pdt_0NYbkcEzkjqKXheG8mvVT";
export const SORTED_PROD_PRODUCT_ID = "pdt_0NaHY46JcpB8ELVhB3zVh";

/** All Sorted product IDs for webhook matching */
export const ALL_SORTED_PRODUCT_IDS = [
  SORTED_TEST_PRODUCT_ID,
  SORTED_PROD_PRODUCT_ID,
] as const;

export function isSortedProductId(productId: string): boolean {
  return (ALL_SORTED_PRODUCT_IDS as readonly string[]).includes(productId);
}

/**
 * Get the Sorted product ID for the current environment
 */
export function getSortedProductId(): string {
  const env = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  return env === "live_mode" ? SORTED_PROD_PRODUCT_ID : SORTED_TEST_PRODUCT_ID;
}

/**
 * Get product IDs based on environment and currency
 * Checks DODO_PAYMENTS_ENVIRONMENT to determine which set to use
 */
export function getProductIds(
  currency: CurrencyCode = "USD"
): Record<PublicPlanType, ProductIdConfig> {
  const env = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  if (currency === "INR") {
    return env === "live_mode" ? PROD_PRODUCT_IDS_INR : TEST_PRODUCT_IDS_INR;
  }
  return env === "live_mode" ? PROD_PRODUCT_IDS : TEST_PRODUCT_IDS;
}

/**
 * Get product ID for a specific plan and billing period
 */
export function getProductId(
  planType: PublicPlanType,
  billingPeriod: "MONTHLY" | "YEARLY"
): string {
  const productIds = getProductIds();
  return billingPeriod === "MONTHLY"
    ? productIds[planType].monthly
    : productIds[planType].yearly;
}

/**
 * Map product ID back to plan type and billing period
 * Supports test, production, and INR IDs
 */
export function getPlanFromProductId(productId: string): {
  planType: PublicPlanType;
  billingPeriod: "MONTHLY" | "YEARLY";
} | null {
  const allMaps = [
    TEST_PRODUCT_IDS,
    PROD_PRODUCT_IDS,
    TEST_PRODUCT_IDS_INR,
    PROD_PRODUCT_IDS_INR,
  ];

  for (const map of allMaps) {
    for (const [plan, ids] of Object.entries(map)) {
      if (ids.monthly === productId) {
        return {
          planType: plan as PublicPlanType,
          billingPeriod: "MONTHLY",
        };
      }
      if (ids.yearly === productId) {
        return {
          planType: plan as PublicPlanType,
          billingPeriod: "YEARLY",
        };
      }
    }
  }

  return null;
}

/**
 * Sorted Extension usage limits
 */
export const SORTED_LIMITS = {
  FREE_TRANSCRIPTION_LIMIT: 10,
  PAID_TRANSCRIPTION_SOFT_LIMIT: 100,
  PAID_TRANSCRIPTION_HARD_LIMIT: 1000,
  PERIOD_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

/**
 * Get all product IDs as a flat array (useful for validation)
 */
export function getAllProductIds(): string[] {
  return [
    TEST_PRODUCT_IDS,
    PROD_PRODUCT_IDS,
    TEST_PRODUCT_IDS_INR,
    PROD_PRODUCT_IDS_INR,
  ].flatMap((map) =>
    Object.values(map).flatMap((ids) => [ids.monthly, ids.yearly])
  );
}
