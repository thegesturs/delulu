"use server";

import { auth, clerkClient } from "@delulu/auth/server";

export const updateOnboardingStep = async (data: {
  currentStep: number;
  stepsCompleted: string[];
  skippedSteps?: string[];
}) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Not authenticated" };
  }

  // VALIDATION: Check step bounds
  if (data.currentStep < 1 || data.currentStep > 4) {
    return { error: "Invalid step number" };
  }

  // VALIDATION: Ensure arrays are valid
  if (!Array.isArray(data.stepsCompleted)) {
    return { error: "Invalid stepsCompleted format" };
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
    console.error("Error updating onboarding step:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update onboarding progress";
    return { error: errorMessage };
  }
};

export const completeOnboarding = async () => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Not authenticated" };
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

    // Get current step data and ensure final step is marked as completed
    const currentStep = (cleanMetadata.currentStep as number) || 4;
    const currentStepsCompleted =
      (cleanMetadata.stepsCompleted as string[]) || [];
    const stepNames = { 1: "welcome", 2: "connect", 3: "pricing", 4: "survey" };
    const finalStepName =
      stepNames[currentStep as keyof typeof stepNames] || "pricing";

    // Add final step to completed steps if not already there
    const allStepsCompleted = Array.from(
      new Set([...currentStepsCompleted, finalStepName])
    );

    // Mark onboarding as complete while preserving other metadata
    const result = await client.users.updateUser(userId, {
      publicMetadata: {
        ...cleanMetadata,
        onboardingComplete: true,
        completedAt: Date.now(),
        // Keep step tracking for analytics
        currentStep,
        stepsCompleted: allStepsCompleted,
        skippedSteps: cleanMetadata.skippedSteps || [],
      },
    });

    return { success: true, publicMetadata: result.publicMetadata };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to complete onboarding";
    return { error: errorMessage };
  }
};

export const completeTour = async (dismissed = false) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Not authenticated" };
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
    console.error("Error updating tour status:", error);
    return { error: "Failed to update tour status" };
  }
};

export const saveSurveyAnswer = async (referralSource: string) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Not authenticated" };
  }

  const client = await clerkClient();

  try {
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

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

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...cleanMetadata,
        referralSource,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving survey answer:", error);
    return { error: "Failed to save survey answer" };
  }
};

export const resetOnboarding = async () => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Not authenticated" };
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
    console.error("Error resetting onboarding:", error);
    return { error: "Failed to reset onboarding" };
  }
};
