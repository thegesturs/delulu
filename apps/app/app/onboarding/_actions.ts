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
    await client.users.updateUser(userId, {
      publicMetadata: {
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
    const result = await client.users.updateUser(userId, {
      publicMetadata: {
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
    await client.users.updateUser(userId, {
      publicMetadata: {
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
