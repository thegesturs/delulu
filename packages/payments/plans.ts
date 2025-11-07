/**
 * Subscription Plan Configuration
 *
 * Defines the limits and features for each subscription tier:
 * - FREE: Basic tier with limited features (1 social, 10 posts/month)
 * - ECHO: Entry-level paid tier (5 socials, 30 posts/month) - $4.99/mo
 * - VIBE: Premium unlimited tier (unlimited socials/posts/storage, 10 team members) - $9.90/mo
 *
 * Note: Pricing matches production environment ($9.90/$99.0 for VIBE)
 */

export type PlanType = 'FREE' | 'VIBE' | 'ECHO';

export interface PlanLimits {
  socialAccounts: number; // Number of connected social media accounts
  monthlyPosts: number; // Number of posts that can be scheduled per month
  mediaStorage: number; // Media storage in MB
  teamMembers: number; // Number of team members
}

export interface PlanFeatures {
  aiContentGeneration: boolean;
  analytics: boolean;
  collaboration: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  advancedScheduling: boolean;
  bulkUpload: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: {
    monthly: number; // Price in USD
    yearly: number; // Price in USD (usually discounted)
  };
  limits: PlanLimits;
  features: PlanFeatures;
  popular?: boolean; // Highlight this plan
}

/**
 * Plan configuration with limits and features
 */
export const PLANS: Record<PlanType, Plan> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    description: 'Perfect for getting started with social media management',
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      socialAccounts: 1,
      monthlyPosts: 10,
      mediaStorage: 100, // 100 MB
      teamMembers: 1,
    },
    features: {
      aiContentGeneration: false,
      analytics: false,
      collaboration: false,
      whiteLabel: false,
      prioritySupport: false,
      customBranding: false,
      advancedScheduling: false,
      bulkUpload: false,
    },
  },
  ECHO: {
    id: 'ECHO',
    name: 'Echo',
    description: 'Great for individuals and small businesses',
    price: {
      monthly: 4.99,
      yearly: 49, // Save 17%
    },
    limits: {
      socialAccounts: 5,
      monthlyPosts: 30,
      mediaStorage: 1000, // 1 GB
      teamMembers: 1,
    },
    features: {
      aiContentGeneration: false,
      analytics: true,
      collaboration: false,
      whiteLabel: false,
      prioritySupport: false,
      customBranding: false,
      advancedScheduling: true,
      bulkUpload: false,
    },
  },
  VIBE: {
    id: 'VIBE',
    name: 'Vibe',
    description: 'Unlimited power for professionals and teams',
    price: {
      monthly: 9.99,
      yearly: 99.0, // Save 17%
    },
    limits: {
      socialAccounts: -1, // Unlimited
      monthlyPosts: -1, // Unlimited
      mediaStorage: -1, // Unlimited
      teamMembers: 10,
    },
    features: {
      aiContentGeneration: true,
      analytics: true,
      collaboration: true,
      whiteLabel: true,
      prioritySupport: true,
      customBranding: true,
      advancedScheduling: true,
      bulkUpload: true,
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
 * Check if a feature is available for a plan
 */
export function hasFeature(planType: PlanType, feature: keyof PlanFeatures): boolean {
  return PLANS[planType].features[feature];
}

/**
 * Check if a limit is within the plan's allowance
 * Returns true if within limit, false if exceeded
 */
export function checkLimit(
  planType: PlanType,
  limitType: keyof PlanLimits,
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
  limitType: keyof PlanLimits,
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
  const tiers: PlanType[] = ['FREE', 'ECHO', 'VIBE'];
  const currentIndex = tiers.indexOf(currentPlan);

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null; // Already at highest tier
  }

  return tiers[currentIndex + 1];
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  if (amount === 0) {
    return 'Free';
  }
  return `$${amount}`;
}

/**
 * Get all plans as an array, ordered by price
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
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
