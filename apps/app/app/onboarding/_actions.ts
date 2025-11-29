'use server';

import { auth, clerkClient } from '@delulu/auth/server';

export const updateOnboardingStep = async (data: {
  currentStep: number;
  stepsCompleted: string[];
  skippedSteps?: string[];
}) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const client = await clerkClient();

  try {
    // Get current user to preserve existing metadata
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

    // Clean up any corrupted array-as-object keys (e.g., "0", "1", "2")
    const cleanMetadata = Object.entries(currentMetadata).reduce(
      (acc, [key, value]) => {
        // Skip numeric string keys that indicate corrupted arrays
        if (!Number.isNaN(Number(key))) {
          return acc;
        }
        acc[key] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    // Merge step progress with existing metadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...cleanMetadata,
        currentStep: data.currentStep,
        stepsCompleted: data.stepsCompleted,
        skippedSteps: data.skippedSteps || [],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return { error: 'Failed to update onboarding progress' };
  }
};

export const completeOnboarding = async () => {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const client = await clerkClient();

  try {
    // Get current user to preserve existing metadata
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

    // Clean up any corrupted array-as-object keys
    const cleanMetadata = Object.entries(currentMetadata).reduce(
      (acc, [key, value]) => {
        if (!Number.isNaN(Number(key))) {
          return acc;
        }
        acc[key] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    // Mark onboarding as complete while preserving other metadata
    const result = await client.users.updateUser(userId, {
      publicMetadata: {
        ...cleanMetadata,
        onboardingComplete: true,
        completedAt: Date.now(),
      },
    });

    return { success: true, publicMetadata: result.publicMetadata };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { error: 'Failed to complete onboarding' };
  }
};

export const completeTour = async (dismissed = false) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const client = await clerkClient();

  try {
    // Get current user to preserve existing metadata
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

    // Clean up any corrupted array-as-object keys
    const cleanMetadata = Object.entries(currentMetadata).reduce(
      (acc, [key, value]) => {
        if (!Number.isNaN(Number(key))) {
          return acc;
        }
        acc[key] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    // Merge tour completion status with existing metadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...cleanMetadata,
        tourCompleted: !dismissed,
        tourDismissed: dismissed,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating tour status:', error);
    return { error: 'Failed to update tour status' };
  }
};

export const resetOnboarding = async () => {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const client = await clerkClient();

  try {
    await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: false,
        currentStep: 1,
        stepsCompleted: [],
        skippedSteps: [],
        tourCompleted: false,
        tourDismissed: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return { error: 'Failed to reset onboarding' };
  }
};
