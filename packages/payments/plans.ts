/**
 * Subscription Plan Configuration
 *
 * Defines the limits and features for each subscription tier:
 * - FREE: Basic tier with limited features
 * - STARTER: Entry-level paid tier
 * - PRO: Full-featured tier for power users
 * - ENTERPRISE: Unlimited tier for teams
 */

export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

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
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    description: 'Great for individuals and small businesses',
    price: {
      monthly: 29,
      yearly: 290, // ~$24/month (save 17%)
    },
    limits: {
      socialAccounts: 3,
      monthlyPosts: 50,
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
  PRO: {
    id: 'PRO',
    name: 'Pro',
    description: 'Best for professionals and growing teams',
    price: {
      monthly: 79,
      yearly: 790, // ~$66/month (save 17%)
    },
    limits: {
      socialAccounts: 10,
      monthlyPosts: 200,
      mediaStorage: 5000, // 5 GB
      teamMembers: 5,
    },
    features: {
      aiContentGeneration: true,
      analytics: true,
      collaboration: true,
      whiteLabel: false,
      prioritySupport: true,
      customBranding: false,
      advancedScheduling: true,
      bulkUpload: true,
    },
    popular: true, // Highlight as most popular
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large teams and agencies',
    price: {
      monthly: 199,
      yearly: 1990, // ~$166/month (save 17%)
    },
    limits: {
      socialAccounts: -1, // Unlimited
      monthlyPosts: -1, // Unlimited
      mediaStorage: -1, // Unlimited
      teamMembers: -1, // Unlimited
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
  const tiers: PlanType[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
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
