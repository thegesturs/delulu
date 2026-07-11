/**
 * Subscription Plan Configuration
 *
 * Defines the limits and features for each subscription tier:
 * - FREE: Basic tier with limited features (1 social, 10 posts/month)
 * - ECHO: Entry-level paid tier (5 socials, 150 posts/month) - $4.99/mo
 * - VIBE: Premium unlimited tier (unlimited socials/posts/storage, 10 team members) - $9.99/mo
 */

export type PlanType = "FREE" | "VIBE" | "ECHO";

/** Paid tiers shown on marketing and billing surfaces */
export type PublicPlanType = Exclude<PlanType, "FREE">;

/** Lifetime deal is no longer offered to new customers */
export const LIFETIME_DEAL_ACTIVE = false;

export type CurrencyCode = "USD" | "INR";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  INR: "₹",
};

export interface PlanLimits {
  socialAccounts: number; // Number of connected social media accounts
  monthlyPosts: number; // Number of posts that can be scheduled per month
  mediaStorage: number; // Media storage in MB (legacy; prefer mediaStorageBytes)
  mediaStorageBytes: number; // Media storage in bytes (quota source of truth)
  teamMembers: number; // Number of team members
  organizations: number; // Number of organizations the user can create
  // Backend-revamp additions (#159). Two distinct axes:
  // rate = requests/min (429), budget = requests/month (402 quota).
  apiRatePerMinute: number; // API-key request rate limit per minute
  apiRequestsPerMonth: number; // Pooled monthly API request budget (per billing owner)
  dmsPerMonth: number; // Monthly auto-DM budget (10% soft overage, see #159)
  mediaRetentionDays: number | null; // null = unlimited retention
}
export type NumericPlanLimitKey = Exclude<
  keyof PlanLimits,
  "mediaRetentionDays"
>;

/**
 * Flat, plan-independent per-user rate limit for interactive session traffic
 * (browser / CLI / MCP). Human UX is not monetized by request rate — only
 * programmatic (API-key) throughput is (#159). The single global constant.
 */
export const SESSION_RATE_PER_MINUTE = 300;

const MB = 1024 * 1024;

export interface PlanFeatures {
  postScheduling: boolean;
  prioritySupport: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: Record<
    CurrencyCode,
    {
      monthly: number;
      yearly: number;
    }
  >;
  limits: PlanLimits;
  features: PlanFeatures;
  popular?: boolean; // Highlight this plan
}

/**
 * Lifetime deal pricing (single seat, VIBE plan)
 */
export const LIFETIME_PRICE: Record<CurrencyCode, number> = {
  USD: 149,
  INR: 13_999,
};

/**
 * Plan configuration with limits and features
 */
export const PLANS: Record<PlanType, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    description: "Perfect for getting started with social media management",
    price: {
      USD: { monthly: 0, yearly: 0 },
      INR: { monthly: 0, yearly: 0 },
    },
    limits: {
      socialAccounts: 1,
      monthlyPosts: 10,
      mediaStorage: 100, // 100 MB
      mediaStorageBytes: 100 * MB,
      teamMembers: 1,
      organizations: 0, // No org creation on free plan
      apiRatePerMinute: 20,
      apiRequestsPerMonth: 15_000, // ≈ 500/day budget (#159; confirm at review)
      dmsPerMonth: 0,
      mediaRetentionDays: 30,
    },
    features: {
      postScheduling: true,
      prioritySupport: false,
    },
  },
  ECHO: {
    id: "ECHO",
    name: "Echo",
    description: "Great for individuals and small businesses",
    price: {
      USD: { monthly: 4.99, yearly: 49 },
      INR: { monthly: 449, yearly: 4499 },
    },
    limits: {
      socialAccounts: 5,
      monthlyPosts: 150,
      mediaStorage: 1000, // 1 GB
      mediaStorageBytes: 1000 * MB,
      teamMembers: 1,
      organizations: 0, // No org creation on Echo
      apiRatePerMinute: 60,
      apiRequestsPerMonth: 150_000,
      dmsPerMonth: 1000,
      mediaRetentionDays: 60,
    },
    features: {
      postScheduling: true,
      prioritySupport: false,
    },
  },
  VIBE: {
    id: "VIBE",
    name: "Vibe",
    description: "Unlimited power for professionals and teams",
    price: {
      USD: { monthly: 9.99, yearly: 99 },
      INR: { monthly: 899, yearly: 8899 },
    },
    limits: {
      socialAccounts: -1, // Unlimited
      monthlyPosts: -1, // Unlimited
      mediaStorage: -1, // Unlimited
      mediaStorageBytes: -1, // Unlimited
      teamMembers: 10,
      organizations: 3,
      apiRatePerMinute: 120,
      apiRequestsPerMonth: 600_000,
      dmsPerMonth: -1, // Unlimited
      mediaRetentionDays: null,
    },
    features: {
      postScheduling: true,
      prioritySupport: true,
    },
    popular: true, // Highlight as most popular
  },
};

/**
 * Helper functions for working with plans
 */

/**
 * Get plan by ID
 */
export function getPlan(planType: PlanType): Plan {
  return PLANS[planType];
}

/**
 * Normalize a stored subscription plan string (e.g. `subscriptions.plan`, which
 * is lower-cased free-form text) into a canonical `PlanType`. Unknown values
 * fall back to `FREE` so quota enforcement always has a floor.
 */
export function resolvePlanType(plan: string | null | undefined): PlanType {
  switch (plan?.toUpperCase()) {
    case "VIBE":
      return "VIBE";
    case "ECHO":
      return "ECHO";
    default:
      return "FREE";
  }
}

/** Resolve the plan limits for a stored subscription plan string. */
export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLANS[resolvePlanType(plan)].limits;
}

/**
 * Check if a feature is available for a plan
 */
export function hasFeature(
  planType: PlanType,
  feature: keyof PlanFeatures
): boolean {
  return PLANS[planType].features[feature];
}

/**
 * Check if a limit is within the plan's allowance
 * Returns true if within limit, false if exceeded
 */
export function checkLimit(
  planType: PlanType,
  limitType: NumericPlanLimitKey,
  currentValue: number
): boolean {
  const limit = PLANS[planType].limits[limitType];

  // -1 means unlimited
  if (limit === -1) {
    return true;
  }

  return currentValue < limit;
}

/**
 * Get remaining allowance for a limit
 * Returns -1 for unlimited plans
 */
export function getRemainingLimit(
  planType: PlanType,
  limitType: NumericPlanLimitKey,
  currentValue: number
): number {
  const limit = PLANS[planType].limits[limitType];

  // -1 means unlimited
  if (limit === -1) {
    return -1;
  }

  return Math.max(0, limit - currentValue);
}

/**
 * Get the next tier up from current plan
 */
export function getNextTier(currentPlan: PlanType): PlanType | null {
  const tiers: PlanType[] = ["FREE", "ECHO", "VIBE"];
  const currentIndex = tiers.indexOf(currentPlan);

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null; // Already at highest tier
  }

  return tiers[currentIndex + 1];
}

/**
 * Format price for display
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode = "USD"
): string {
  if (amount === 0) {
    return "Free";
  }
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted =
    currency === "INR" ? amount.toLocaleString("en-IN") : amount.toString();
  return `${symbol}${formatted}`;
}

/**
 * Determine currency from country code (e.g. Cloudflare CF-IPCountry header)
 */
export function getCurrencyFromCountry(country: string): CurrencyCode {
  return country === "IN" ? "INR" : "USD";
}

/**
 * Get all plans as an array, ordered by price
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

export type PublicPlan = Plan & { id: PublicPlanType };

/** Paid plans for public pricing UI (excludes FREE) */
export function getPublicPlans(): PublicPlan[] {
  return [PLANS.ECHO, PLANS.VIBE] as PublicPlan[];
}

/** Approximate annual savings vs paying monthly (for marketing copy) */
export function getMaxYearlySavingsPercent(): number {
  let max = 0;
  for (const plan of getPublicPlans()) {
    for (const currency of ["USD", "INR"] as const) {
      const { monthly, yearly } = plan.price[currency];
      if (monthly > 0 && yearly > 0) {
        const pct = Math.round((1 - yearly / (monthly * 12)) * 100);
        max = Math.max(max, pct);
      }
    }
  }
  return max;
}

export function formatDmLimit(limit: number): string {
  if (limit === -1) {
    return "Unlimited";
  }
  return limit.toLocaleString();
}

/**
 * Compare two plans to see if upgrade is needed for a feature
 */
export function needsUpgrade(
  currentPlan: PlanType,
  targetFeature: keyof PlanFeatures
): boolean {
  return !PLANS[currentPlan].features[targetFeature];
}
